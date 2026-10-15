import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GeneticAlgorithm,
  buildSlots,
  decode,
  totalsOf,
  type Genome,
  type MenuSlot,
  type MenuTarget,
} from '../services/GeneticAlgorithm';
import { FOOD_CATEGORY_LABELS, loadMenuFoods, migrateFoodKeys, type MenuFood, type MenuNutrient } from '../services/FoodDatabase';
import { scaleHouseholdMeasure } from '../services/householdMeasure';
import { MENU_ENGINE_VERSION } from '../data/menuConfig';
import { AKG_BASE_FEMALE, PREGNANCY_INCREMENT } from '../data/mochiConfig';
import { NutritionCalculator } from '../services/NutritionCalculator';
import type { Allergen } from '../data/menuFoods';
import type { FoodContext, MochiCalculationResult } from '../models/types';
import { STORAGE_KEYS, readJSON } from '../services/storage';

const ALLERGEN_LABELS: Record<Allergen, string> = {
  telur: 'telur',
  susu: 'susu',
  ikan: 'ikan',
  udang: 'udang',
  kacang_tanah: 'kacang tanah',
  kedelai: 'kedelai',
  gandum: 'gandum/terigu',
};

interface Exclusion {
  keys: Set<string>;
  /** Kelompok alergen dari makanan yang ditandai alergi — semua makanan se-alergen ikut disingkirkan */
  allergens: Allergen[];
  count: number;
}

/**
 * R34 (alergi) / R35 (tidak suka) / R38 (pantangan): makanan disingkirkan SEBELUM GA.
 * Alergi diperluas ke kelompok alergennya (alergi "Telur dadar" → semua makanan bertelur).
 * Tidak ada fallback yang memunculkan kembali makanan alergi.
 */
function buildExclusion(foods: MenuFood[], ctx: FoodContext | null): Exclusion {
  if (!ctx) return { keys: new Set(), allergens: [], count: 0 };
  const allergyKeys = new Set(migrateFoodKeys(ctx.allergyFoodKeys));
  const allergens = [...new Set(foods.filter((f) => allergyKeys.has(f.key)).flatMap((f) => f.allergens))];
  const keys = new Set([
    ...allergyKeys,
    ...migrateFoodKeys(ctx.dislikedFoodKeys),
    ...migrateFoodKeys(ctx.tabooFoodKeys ?? []),
  ]);
  for (const f of foods) {
    if (f.allergens.some((a) => allergens.includes(a))) keys.add(f.key);
  }
  return { keys, allergens, count: foods.filter((f) => keys.has(f.key)).length };
}

/**
 * Target dihitung ulang dari kelompok umur + trimester + EER yang tersimpan, agar hasil yang
 * disimpan sebelum target baru (mis. tiamin) ditambahkan tetap lengkap.
 */
function targetFrom(r: MochiCalculationResult): MenuTarget {
  const t =
    r.akgAgeGroup in AKG_BASE_FEMALE && r.trimester in PREGNANCY_INCREMENT
      ? NutritionCalculator.calculateNutrientTargets(r.akgAgeGroup, r.trimester, r.eerKcalDay)
      : r.targets;
  return {
    energy: r.eerKcalDay,
    protein: t.protein,
    carbs: t.carbs,
    fat: t.fat,
    fiber: t.fiber,
    iron: t.iron_mg,
    calcium: t.calcium_mg,
    zinc: t.zinc_mg,
    vitC: t.vitC_mg,
    thiamin: t.thiamin_mg,
    riboflavin: t.riboflavin_mg,
    niacin: t.niacin_mg,
    phosphorus: t.phosphorus_mg,
    potassium: t.potassium_mg,
    sodium: t.sodium_mg,
  };
}

const fmt = (n: number, digits = 1) => n.toLocaleString('id-ID', { maximumFractionDigits: digits });
const fmtKcal = (n: number) => Math.round(n).toLocaleString('id-ID');

const GOALS: Array<{ key: MenuNutrient; label: string; unit: string; digits: number }> = [
  { key: 'energy', label: 'Energi', unit: 'kkal', digits: 0 },
  { key: 'protein', label: 'Protein', unit: 'g', digits: 0 },
  { key: 'carbs', label: 'Karbohidrat', unit: 'g', digits: 0 },
  { key: 'fat', label: 'Lemak', unit: 'g', digits: 0 },
  { key: 'fiber', label: 'Serat', unit: 'g', digits: 0 },
  { key: 'iron', label: 'Zat besi', unit: 'mg', digits: 1 },
  { key: 'calcium', label: 'Kalsium', unit: 'mg', digits: 0 },
  { key: 'zinc', label: 'Seng', unit: 'mg', digits: 1 },
  { key: 'vitC', label: 'Vitamin C', unit: 'mg', digits: 0 },
  { key: 'thiamin', label: 'Tiamin (B1)', unit: 'mg', digits: 1 },
];

/** Dihitung dan ditampilkan, tetapi tidak ikut fungsi fitness (lihat FITNESS_WEIGHTS). */
const OTHER_NUTRIENTS: Array<{ key: MenuNutrient; label: string; unit: string; digits: number }> = [
  { key: 'riboflavin', label: 'Riboflavin (B2)', unit: 'mg', digits: 1 },
  { key: 'niacin', label: 'Niasin (B3)', unit: 'mg', digits: 1 },
  { key: 'phosphorus', label: 'Fosfor', unit: 'mg', digits: 0 },
  { key: 'potassium', label: 'Kalium', unit: 'mg', digits: 0 },
];

const Recommendation: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [target, setTarget] = useState<MenuTarget | null>(null);
  const [slots, setSlots] = useState<MenuSlot[]>([]);
  const [genome, setGenome] = useState<Genome | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [exclusion, setExclusion] = useState<Exclusion>({ keys: new Set(), allergens: [], count: 0 });

  const plan = useCallback(async (): Promise<boolean> => {
    const mochi = readJSON<MochiCalculationResult>(STORAGE_KEYS.result);
    if (!mochi?.targets || typeof mochi.eerKcalDay !== 'number') return false;
    const ctx = readJSON<FoodContext>(STORAGE_KEYS.food);
    const foods = await loadMenuFoods();
    const excl = buildExclusion(foods, ctx);
    const likedKeys = new Set(migrateFoodKeys(ctx?.likedFoodKeys ?? []));
    const t = targetFrom(mochi);
    const s = buildSlots(foods, excl.keys);
    setTarget(t);
    setExclusion(excl);
    setLiked(likedKeys);
    setSlots(s);
    setGenome(GeneticAlgorithm.run(s, t, likedKeys));
    return true;
  }, []);

  useEffect(() => {
    plan()
      .then((ok) => {
        if (!ok) navigate('/profile');
      })
      .catch((err) => {
        console.error('Gagal menyusun menu', err);
        setLoadError('Data komposisi pangan gagal dimuat. Periksa koneksi, lalu coba lagi.');
      })
      .finally(() => setLoading(false));
  }, [plan, navigate]);

  const regenerate = () => {
    setLoading(true);
    setLoadError('');
    // beri kesempatan loader tampil sebelum GA (~0,2 detik) berjalan
    window.setTimeout(() => {
      plan()
        .catch(() => setLoadError('Data komposisi pangan gagal dimuat. Periksa koneksi, lalu coba lagi.'))
        .finally(() => setLoading(false));
    }, 30);
  };

  const substitute = (slotIndex: number) => {
    if (!genome || !target) return;
    setGenome(GeneticAlgorithm.substitute(slots, genome, slotIndex, target, liked));
  };

  const meals = useMemo(() => (genome ? decode(slots, genome) : []), [slots, genome]);
  const totals = useMemo(() => totalsOf(meals.flatMap((m) => m.items)), [meals]);
  const emptySlots = slots.filter((s) => s.pool.length === 0);

  if (loading) {
    return (
      <main className="container loading">
        <p>Menyusun menu yang paling mendekati target Ibu…</p>
        <div className="loader" />
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="container page page-narrow">
        <div className="card">
          <p role="alert">{loadError}</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={regenerate}>
            Coba lagi
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container page">
      <div className="result-head">
        <div>
          <span className="kicker">Langkah 3 dari 4</span>
          <h1>Menu hari ini</h1>
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            Tiga kali makan dan dua kali selingan, disusun agar total sehari mendekati kebutuhan energi, protein, zat
            besi, kalsium, seng, dan vitamin C Ibu.
          </p>
        </div>
        <button onClick={regenerate} className="btn btn-ghost">
          Susun ulang
        </button>
      </div>

      {exclusion.count > 0 && (
        <p className="menu-notice">
          {exclusion.count} makanan tidak dipakai karena alergi, tidak disukai, atau pantangan.
          {exclusion.allergens.length > 0 &&
            ` Karena alergi, semua makanan yang mengandung ${exclusion.allergens.map((a) => ALLERGEN_LABELS[a]).join(', ')} ikut disingkirkan.`}
        </p>
      )}
      {emptySlots.length > 0 && (
        <p className="menu-notice warn">
          Tidak ada pilihan tersisa untuk{' '}
          {emptySlots.map((s) => `${s.categories.map((c) => FOOD_CATEGORY_LABELS[c].toLowerCase()).join('/')} (${s.mealLabel.toLowerCase()})`).join(', ')}
          , jadi bagian itu dikosongkan.
        </p>
      )}

      <div className="menu-layout">
        <div className="meals">
          {meals.map((meal) => {
            if (meal.items.length === 0) return null;
            const kcal = meal.items.reduce((a, i) => a + (i.food.perPortion.energy ?? 0) * i.portions, 0);
            const isSnack = meal.key.startsWith('selingan');
            return (
              <section key={meal.key} className={`meal-card${isSnack ? ' snack' : ''}`} aria-label={meal.label}>
                <div className="meal-head">
                  <h2>{meal.label}</h2>
                  <span>{fmtKcal(kcal)} kkal</span>
                </div>
                <ul className="meal-items">
                  {meal.items.map((item) => {
                    const { food, portions } = item;
                    const p = (n: MenuNutrient) => {
                      const v = food.perPortion[n];
                      return v == null ? null : v * portions;
                    };
                    const iron = p('iron');
                    const calcium = p('calcium');
                    return (
                      <li key={item.slotIndex} className="meal-item">
                        <div>
                          <span className="item-cat">
                            {FOOD_CATEGORY_LABELS[food.category]}
                            <span className="item-code" title={`TKPI 2017: ${food.tkpiName}`}>
                              {' '}· TKPI {food.code}
                            </span>
                          </span>
                          <span className="item-name">{food.name}</span>
                          <span className="item-macros">
                            {scaleHouseholdMeasure(food.portionLabel, portions)} · {fmt(food.portionG * portions, 0)} g
                            {' · '}protein {fmt(p('protein') ?? 0)} g
                            {iron != null && ` · besi ${fmt(iron)} mg`}
                            {calcium != null && ` · kalsium ${fmt(calcium, 0)} mg`}
                          </span>
                        </div>
                        <div className="item-kcal">
                          {fmtKcal(p('energy') ?? 0)} kkal
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-small"
                          onClick={() => substitute(item.slotIndex)}
                          aria-label={`Ganti ${food.name}`}
                        >
                          Ganti
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <aside className="side-panel">
          {target && (
            <div className="card">
              <h3 style={{ marginBottom: '0.9rem' }}>Dibanding target harian</h3>
              {GOALS.map((g) => {
                const total = totals.value[g.key];
                const tgt = target[g.key];
                if (!Number.isFinite(tgt)) return null; // hasil tersimpan versi lama tanpa target ini
                const pct = tgt > 0 ? Math.round((total / tgt) * 100) : 0;
                const missing = totals.missing[g.key];
                return (
                  <div key={g.key} className="goal-row">
                    <div className="goal-row-head">
                      <strong>{g.label}</strong>
                      <span className="goal-pct">
                        {missing > 0 && '≥ '}
                        {fmt(total, g.digits)} / {fmt(tgt, g.digits)} {g.unit}
                      </span>
                    </div>
                    <div
                      className="goal-bar"
                      role="progressbar"
                      aria-label={g.label}
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="goal-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    {missing > 0 && (
                      <p className="goal-missing">
                        {missing} makanan tidak punya data {g.label.charAt(0).toLowerCase() + g.label.slice(1)} di TKPI — tidak dihitung sebagai 0.
                      </p>
                    )}
                  </div>
                );
              })}
              <p className="note" style={{ marginTop: '1rem' }}>
                Folat belum dihitung: TKPI 2017 tidak memuat folat. Tablet tambah darah tetap diminum sesuai anjuran
                bidan.
              </p>
            </div>
          )}

          {target && (
            <div className="card">
              <h3>Zat gizi lain</h3>
              <p className="note" style={{ margin: '0.25rem 0 0.6rem' }}>
                Ikut dihitung dari TKPI, tetapi tidak dipakai untuk menyusun menu.
              </p>
              <dl className="other-list">
                {OTHER_NUTRIENTS.map((n) => (
                  <div key={n.key}>
                    <dt>{n.label}</dt>
                    <dd>
                      {totals.missing[n.key] > 0 && '≥ '}
                      {fmt(totals.value[n.key], n.digits)}
                      {Number.isFinite(target[n.key]) && ` / ${fmt(target[n.key], n.digits)}`} {n.unit}
                    </dd>
                  </div>
                ))}
                <div>
                  <dt>Natrium</dt>
                  <dd>
                    {totals.missing.sodium > 0 && '≥ '}
                    {fmt(totals.value.sodium, 0)} mg
                  </dd>
                </div>
              </dl>
              <p className="note" style={{ marginTop: '0.6rem' }}>
                Natrium belum termasuk garam yang ditambahkan saat memasak. Tanda ≥ berarti sebagian makanan tidak punya
                data di TKPI.
              </p>
            </div>
          )}

          <div className="card">
            <h3>Lanjut: target minggu ini</h3>
            <p className="muted" style={{ fontSize: '0.92rem', margin: '0.3rem 0 0.9rem' }}>
              Pilih satu-dua kebiasaan kecil yang mau Ibu coba.
            </p>
            <Link to="/targets" className="link-arrow">
              Pasang target
            </Link>
          </div>

          <p className="note">
            Komposisi gizi: TKPI 2017 (Kemenkes RI), per 100 g bagian yang dapat dimakan, dari berkas tkpi_*.csv. Berat
            porsi masih perkiraan awal dan menunggu penetapan tim gizi. {MENU_ENGINE_VERSION}
          </p>
        </aside>
      </div>
    </main>
  );
};

export default Recommendation;
