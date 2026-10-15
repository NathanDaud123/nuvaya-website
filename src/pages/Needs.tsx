import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { BmiCategoryId, MaternalProfile, MochiCalculationResult } from '../models/types';
import { AKG_BASE_FEMALE, BMI_CATEGORIES, GWG_FIRST_TRIMESTER_KG, PREGNANCY_INCREMENT } from '../data/mochiConfig';
import type { AkgBase } from '../data/mochiConfig';
import { STORAGE_KEYS, readJSON } from '../services/storage';

function isFiniteNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Cache rusak (mis. '{}', '"hi"') bersifat truthy — tolak sebelum render menyentuh mochi.gaTarget. */
function isValidMochiResult(v: unknown): v is MochiCalculationResult {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const ga = r.gaTarget;
  const targets = r.targets;
  if (typeof ga !== 'object' || ga === null) return false;
  if (typeof targets !== 'object' || targets === null) return false;
  const gaRec = ga as Record<string, unknown>;
  const tRec = targets as Record<string, unknown>;
  const gaFields = ['calories', 'protein', 'carbs', 'fat'];
  const targetFields = ['protein', 'iron_mg', 'calcium_mg', 'folate_mcg', 'waterMl'];
  return (
    gaFields.every((f) => isFiniteNum(gaRec[f])) &&
    targetFields.every((f) => isFiniteNum(tRec[f]))
  );
}

const BMI_LABELS: Record<BmiCategoryId, string> = {
  underweight: 'Berat badan kurang',
  normal: 'Normal',
  overweight: 'Berat badan berlebih',
  obesity: 'Obesitas',
};

const fmt = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 });

const pct = (v: number, lo: number, hi: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));

/** Garis skala dengan pita rentang dan penanda posisi Ibu. */
const Scale: React.FC<{
  lo: number;
  hi: number;
  band: [number, number];
  value: number;
  valueLabel: string;
  ticks: Array<{ at: number; label: string }>;
  ariaLabel: string;
}> = ({ lo, hi, band, value, valueLabel, ticks, ariaLabel }) => (
  <div role="img" aria-label={ariaLabel}>
    <div className="scale">
      <div className="scale-band" style={{ left: `${pct(band[0], lo, hi)}%`, right: `${100 - pct(band[1], lo, hi)}%` }} />
      <div className="scale-marker" style={{ left: `${pct(value, lo, hi)}%` }}>
        <span className="scale-marker-label" style={{ left: '50%' }}>
          {valueLabel}
        </span>
      </div>
    </div>
    <div className="scale-ticks">
      {ticks.map((t) => {
        const p = pct(t.at, lo, hi);
        const edge = p <= 2 ? 'edge-start' : p >= 98 ? 'edge-end' : undefined;
        return (
          <span key={t.label} className={edge} style={{ left: `${p}%` }}>
            {t.label}
          </span>
        );
      })}
    </div>
  </div>
);

const Needs: React.FC = () => {
  const navigate = useNavigate();
  const [mochi, setMochi] = useState<MochiCalculationResult | null>(null);
  const [weeks, setWeeks] = useState<number | null>(null);

  useEffect(() => {
    const parsed = readJSON<MochiCalculationResult>(STORAGE_KEYS.result);
    if (!parsed || !isValidMochiResult(parsed)) {
      navigate('/profile');
      return;
    }
    setMochi(parsed);
    const profile = readJSON<Partial<MaternalProfile>>(STORAGE_KEYS.profile);
    if (profile && isFiniteNum(profile.gestationalAgeWeeks)) setWeeks(profile.gestationalAgeWeeks);
  }, [navigate]);

  if (!mochi) {
    return (
      <main className="container loading">
        <p>Memuat kebutuhan gizi…</p>
        <div className="loader" />
      </main>
    );
  }

  const t = mochi.targets;
  const base = AKG_BASE_FEMALE[mochi.akgAgeGroup];
  const inc = PREGNANCY_INCREMENT[mochi.trimester];
  /** "AKG 60 + 10" — dari mana angka target berasal */
  const calc = (key: keyof AkgBase) => (base && inc ? `${fmt(base[key])} + ${fmt(inc[key] ?? 0)}` : undefined);

  const tiles: Array<{ label: string; value: number; unit: string; calc?: string }> = [
    { label: 'Protein', value: t.protein, unit: 'g', calc: calc('proteinG') },
    { label: 'Zat besi', value: t.iron_mg, unit: 'mg', calc: calc('iron_mg') },
    { label: 'Kalsium', value: t.calcium_mg, unit: 'mg', calc: calc('calcium_mg') },
    { label: 'Folat', value: t.folate_mcg, unit: 'mcg', calc: calc('folate_mcg') },
    { label: 'Karbohidrat', value: t.carbs, unit: 'g', calc: calc('carbsG') },
    { label: 'Lemak', value: t.fat, unit: 'g', calc: calc('fatG') },
    { label: 'Serat', value: t.fiber, unit: 'g', calc: calc('fiberG') },
    { label: 'Air', value: t.waterMl, unit: 'ml', calc: calc('waterMl') },
  ];

  const hasExpected = isFiniteNum(mochi.gwgExpectedMinKg) && isFiniteNum(mochi.gwgExpectedMaxKg);
  const gwgLo = Math.min(0, mochi.gwgActualKg);
  const gwgHi = Math.max(mochi.gwgTargetMaxKg, mochi.gwgActualKg);
  const bmiBounds = BMI_CATEGORIES.filter((c) => c.min > 0).map((c) => c.min);

  return (
    <main className="container page">
      <div className="result-head">
        <div>
          <span className="week-badge">
            {weeks != null && `Minggu ke-${fmt(weeks)} · `}Trimester {mochi.trimester}
          </span>
          <h1>Kebutuhan gizi harian Ibu</h1>
        </div>
        <Link to="/profile" className="link-arrow">
          Ubah profil
        </Link>
      </div>

      <section className="energy-card" aria-label="Kebutuhan energi">
        <p className="energy-value">
          {fmt(mochi.eerKcalDay)}
          <small>kkal per hari</small>
        </p>
        <div className="energy-explain">
          <p>
            Dihitung dengan persamaan energi DRI 2023 khusus kehamilan — memakai usia, tinggi, berat, minggu
            kehamilan, dan tingkat aktivitas Ibu.
          </p>
          <p className="note">
            Sebagai pembanding, AKG 2019 untuk perempuan {mochi.akgAgeGroup} tahun di trimester {mochi.trimester}:{' '}
            {fmt(t.akgReferenceEnergyKcal)} kkal.
          </p>
        </div>
      </section>

      <div className="nutrient-grid">
        {tiles.map((tile) => (
          <div className="nutrient-tile" key={tile.label}>
            <div className="tile-label">{tile.label}</div>
            <div className="tile-value">
              {fmt(tile.value)}
              <small>{tile.unit}</small>
            </div>
            {tile.calc && <div className="tile-calc">{tile.calc}</div>}
          </div>
        ))}
      </div>
      <p className="note" style={{ marginTop: '-0.5rem', marginBottom: '1.75rem' }}>
        Angka kecil: AKG 2019 perempuan {mochi.akgAgeGroup} tahun + tambahan trimester {mochi.trimester}.
      </p>

      <div className="status-grid">
        <section className="card" aria-label="IMT sebelum hamil">
          <h3>IMT sebelum hamil</h3>
          <div className="status-figure">
            <strong>{fmt(mochi.prepregnancyBmi)}</strong>
            <span>{BMI_LABELS[mochi.bmiCategory] ?? mochi.bmiCategory}</span>
          </div>
          <Scale
            lo={15}
            hi={35}
            band={[18.5, 25]}
            value={mochi.prepregnancyBmi}
            valueLabel={fmt(mochi.prepregnancyBmi)}
            ticks={bmiBounds.map((b) => ({ at: b, label: fmt(b) }))}
            ariaLabel={`IMT ${fmt(mochi.prepregnancyBmi)}, rentang normal 18,5 sampai 25`}
          />
          <p className="status-note">Kategori ini menentukan rentang kenaikan berat badan yang dianjurkan IOM.</p>
        </section>

        <section className="card" aria-label="Kenaikan berat badan">
          <h3>Kenaikan berat badan</h3>
          <div className="status-figure">
            <strong>{fmt(mochi.gwgActualKg)} kg</strong>
            <span>sejak sebelum hamil</span>
          </div>
          {hasExpected ? (
            <>
              <Scale
                lo={gwgLo}
                hi={gwgHi}
                band={[mochi.gwgExpectedMinKg as number, mochi.gwgExpectedMaxKg as number]}
                value={mochi.gwgActualKg}
                valueLabel={`${fmt(mochi.gwgActualKg)} kg`}
                ticks={[
                  { at: gwgLo, label: `${fmt(gwgLo)} kg` },
                  { at: gwgHi, label: `${fmt(gwgHi)} kg` },
                ]}
                ariaLabel={`Kenaikan ${fmt(mochi.gwgActualKg)} kg; rentang IOM sampai minggu ini ${fmt(mochi.gwgExpectedMinKg as number)} sampai ${fmt(mochi.gwgExpectedMaxKg as number)} kg`}
              />
              <p className="status-note">
                Rentang IOM sampai minggu ini (pita hijau):{' '}
                <strong>
                  {fmt(mochi.gwgExpectedMinKg as number)}–{fmt(mochi.gwgExpectedMaxKg as number)} kg
                </strong>
                . Sampai persalinan: {fmt(mochi.gwgTargetMinKg)}–{fmt(mochi.gwgTargetMaxKg)} kg.
              </p>
            </>
          ) : (
            <p className="status-note">
              {mochi.trimester === 1 &&
                `Di trimester 1, IOM memperkirakan kenaikan sekitar ${fmt(GWG_FIRST_TRIMESTER_KG.min)}–${fmt(GWG_FIRST_TRIMESTER_KG.max)} kg. `}
              Sampai persalinan: {fmt(mochi.gwgTargetMinKg)}–{fmt(mochi.gwgTargetMaxKg)} kg.
            </p>
          )}
          <p className="note" style={{ marginTop: '0.5rem' }}>
            Ini panduan pemantauan, bukan diagnosis. Bahas grafik berat badan dengan bidan saat kontrol.
          </p>
        </section>
      </div>

      <div className="result-actions">
        <button onClick={() => navigate('/recommendation')} className="btn btn-primary">
          Susun menu hari ini
        </button>
        <Link to="/edukasi" className="btn btn-ghost">
          Baca edukasi gizi
        </Link>
      </div>

      <p className="note" style={{ marginTop: '2.5rem' }}>
        {mochi.algorithmVersion} · {mochi.energyReference} · {mochi.nutrientReference} · {mochi.gwgReference}
      </p>
    </main>
  );
};

export default Needs;
