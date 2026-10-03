import React, { useEffect, useState } from 'react';
import type { FoodLibrary, RecommendedMenu } from '../services/GeneticAlgorithm';
import { GeneticAlgorithm } from '../services/GeneticAlgorithm';
import { CATEGORY_ORDER, loadFoodLibrary, STANDARD_PORTION_GRAMS } from '../services/FoodDatabase';
import type { FoodContext, MochiCalculationResult, NutritionalNeeds } from '../models/types';
import { StatList, StatRow } from '../components/StatList';
import { STORAGE_KEYS, loadStored } from '../services/storage';
import { useNavigate } from 'react-router-dom';

/**
 * R34/R35: alergi tidak pernah ditampilkan; makanan yang tidak disukai diganti.
 * Kategori yang habis terkecualikan dipakai utuh (fallback) agar GA tetap jalan.
 */
function applyFoodContext(library: FoodLibrary, ctx: FoodContext | null): { filtered: FoodLibrary; excludedCount: number } {
  if (!ctx) return { filtered: library, excludedCount: 0 };
  const excluded = new Set([...ctx.allergyFoodKeys, ...ctx.dislikedFoodKeys]);
  if (excluded.size === 0) return { filtered: library, excludedCount: 0 };

  const filtered = {} as FoodLibrary;
  let excludedCount = 0;
  (Object.keys(library) as (keyof FoodLibrary)[]).forEach((cat) => {
    const kept = library[cat].filter((item) => !excluded.has(`${cat}:${item.menu}`));
    excludedCount += library[cat].length - kept.length;
    filtered[cat] = kept.length > 0 ? kept : library[cat];
  });
  return { filtered, excludedCount };
}

const Recommendation: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [needs, setNeeds] = useState<NutritionalNeeds | null>(null);
  const [menu, setMenu] = useState<RecommendedMenu | null>(null);
  const [totals, setTotals] = useState<NutritionalNeeds | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [excludedCount, setExcludedCount] = useState(0);

  const fmtNum = (n: number) =>
    n.toLocaleString('id-ID', { maximumFractionDigits: 1 });
  const fmtKcal = (n: number) => Math.round(n).toLocaleString('id-ID');

  const [library, setLibrary] = useState<FoodLibrary | null>(null);

  const applyTotals = (m: RecommendedMenu) => {
    const allItems = [...m.breakfast, ...m.lunch, ...m.dinner];
    setTotals({
      calories: Math.round(allItems.reduce((a, i) => a + i.energy, 0)),
      protein: Math.round(allItems.reduce((a, i) => a + i.protein, 0)),
      carbs: Math.round(allItems.reduce((a, i) => a + i.carbo, 0)),
      fat: Math.round(allItems.reduce((a, i) => a + i.fat, 0)),
      fiber: 0,
    });
    setTotalPrice(allItems.reduce((a, i) => a + i.price, 0));
  };

  /** Ganti satu item dengan alternatif se-kategori (di luar alergi/hindari). */
  const substitute = (mealKey: keyof RecommendedMenu, idx: number) => {
    if (!menu || !library) return;
    const cat = CATEGORY_ORDER[idx];
    if (!cat) return;
    const current = menu[mealKey][idx];
    const candidates = library[cat].filter((i) => i.menu !== current.menu);
    if (candidates.length === 0) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const next: RecommendedMenu = {
      ...menu,
      [mealKey]: menu[mealKey].map((it, i) => (i === idx ? pick : it)),
    };
    setMenu(next);
    applyTotals(next);
  };

  useEffect(() => {
    const savedMochi = loadStored(STORAGE_KEYS.result);
    const savedNeeds = loadStored(STORAGE_KEYS.needs);
    if (!savedMochi && !savedNeeds) {
      navigate('/profile');
      return;
    }
    // Preferensi kini menyatu di Profil Ibu; fallback ke profil bila belum ada
    const savedFood = loadStored(STORAGE_KEYS.food);
    if (!savedFood) {
      navigate('/profile');
      return;
    }
    const foodCtx = JSON.parse(savedFood) as FoodContext;

    const run = async () => {
      try {
        const library = await loadFoodLibrary();
        const { filtered, excludedCount: n } = applyFoodContext(library, foodCtx);
        setLibrary(filtered);
        setExcludedCount(n);

        let target: NutritionalNeeds;
        if (savedMochi) {
          const parsed = JSON.parse(savedMochi) as MochiCalculationResult;
          target = parsed.gaTarget;
        } else {
          target = JSON.parse(savedNeeds as string) as NutritionalNeeds;
        }
        setNeeds(target);

        const recommended = GeneticAlgorithm.run(filtered, target);
        if (recommended) {
          setMenu(recommended);
          applyTotals(recommended);
        }
      } catch (error) {
        console.error('Error loading datasets', error);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [navigate]);

  const regenerate = async () => {
    if (!needs) return;
    setLoading(true);
    try {
      const library = await loadFoodLibrary();
      const savedFood = loadStored(STORAGE_KEYS.food);
      const { filtered } = applyFoodContext(library, savedFood ? (JSON.parse(savedFood) as FoodContext) : null);
      setLibrary(filtered);
      const recommended = GeneticAlgorithm.run(filtered, needs);
      if (recommended) {
        setMenu(recommended);
        applyTotals(recommended);
      }
    } catch (error) {
      console.error('Error regenerating menu', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}><h2>Memproses Rekomendasi GA...</h2><div className="loader"></div></div>;
  }

  return (
    <div className="container reco-page">
      <div className="section-header">
        <h2>Rekomendasi Menu Anda</h2>
        <p>Menu ini disusun untuk mendekati target gizi harian Anda.</p>
        {excludedCount > 0 && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
            {excludedCount} makanan dikecualikan sesuai alergi / makanan yang Anda hindari.
          </p>
        )}
      </div>

      <div className="reco-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {totals && (
            <div className="focus-item highlight-panel">
              <h3>Total Menu Rekomendasi</h3>
              <StatList labelWidth="8rem">
                <StatRow label="Kalori">{totals.calories} kcal</StatRow>
                <StatRow label="Protein">{totals.protein} g</StatRow>
                <StatRow label="Karbohidrat">{totals.carbs} g</StatRow>
                <StatRow label="Lemak">{totals.fat} g</StatRow>
                <StatRow label="Estimasi Harga">Rp {totalPrice.toLocaleString('id-ID')}</StatRow>
              </StatList>
            </div>
          )}

          {needs && totals && (
            <div className="focus-item bordered-panel">
              <h3>Capaian Target Harian</h3>
              {(
                [
                  { label: 'Kalori', total: totals.calories, target: needs.calories, unit: 'kcal' },
                  { label: 'Protein', total: totals.protein, target: needs.protein, unit: 'g' },
                  { label: 'Karbohidrat', total: totals.carbs, target: needs.carbs, unit: 'g' },
                  { label: 'Lemak', total: totals.fat, target: needs.fat, unit: 'g' },
                ] as const
              ).map((g) => {
                const pct = g.target > 0 ? Math.round((g.total / g.target) * 100) : 0;
                return (
                  <div key={g.label} className="goal-row">
                    <div className="goal-row-head">
                      <strong>{g.label}</strong>
                      <span className="goal-pct">
                        {g.total.toLocaleString('id-ID')} / {g.target.toLocaleString('id-ID')} {g.unit} • {pct}%
                      </span>
                    </div>
                    <div className="goal-bar">
                      <div
                        className={`goal-fill${pct > 100 ? ' over' : ''}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {menu && (
          <div className="focus-item bordered-panel">
            <h3>Menu Harian</h3>
            <table className="day-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Menu</th>
                  <th>Berat</th>
                  <th>Kalori</th>
                  <th>Karbohidrat</th>
                  <th>Protein</th>
                  <th>Lemak</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    { key: 'breakfast', label: 'Sarapan' },
                    { key: 'lunch', label: 'Makan Siang' },
                    { key: 'dinner', label: 'Makan Malam' },
                  ] as const
                ).map(({ key, label }) =>
                  menu[key].map((item, idx) => (
                    <tr key={`${key}-${idx}`}>
                      {idx === 0 && (
                        <td rowSpan={menu[key].length} className="meal-cell">
                          {label}
                        </td>
                      )}
                      <td>{item.menu}</td>
                      <td className="num">{STANDARD_PORTION_GRAMS[CATEGORY_ORDER[idx]]} gram</td>
                      <td className="num">{fmtKcal(item.energy)} kcal</td>
                      <td className="num">{fmtNum(item.carbo)} gram</td>
                      <td className="num">{fmtNum(item.protein)} gram</td>
                      <td className="num">{fmtNum(item.fat)} gram</td>
                      <td>
                        <button
                          type="button"
                          className="btn-outline btn-mini"
                          onClick={() => substitute(key, idx)}
                          title="Ganti dengan makanan lain se-kategori"
                        >
                          Ganti
                        </button>
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Berat porsi standar per kategori; nilai gizi per porsi standar.
            </p>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button onClick={regenerate} className="btn-primary">
          Generate Ulang Menu
        </button>
      </div>
    </div>
  );
};

export default Recommendation;
