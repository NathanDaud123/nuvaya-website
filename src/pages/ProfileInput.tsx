import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FoodConstraint, FoodContext, MaternalProfile, PhysicalActivityCategory } from '../models/types';
import { FOOD_CONSTRAINT_LABELS } from '../models/types';
import { NutritionCalculator } from '../services/NutritionCalculator';
import { FOOD_CATEGORY_LABELS, fallbackFoodLabel, loadMenuFoods, migrateFoodKeys } from '../services/FoodDatabase';
import { STORAGE_KEYS, clearAllStored, readJSON, saveStored } from '../services/storage';
import AutocompleteMulti, { type SuggestOption } from '../components/AutocompleteMulti';

/** Kategori aktivitas DRI 2023, dijelaskan dengan bahasa sehari-hari. */
const ACTIVITY_OPTIONS: Array<{ value: PhysicalActivityCategory; label: string; desc: string }> = [
  { value: 'inactive', label: 'Tidak aktif', desc: 'Hanya kegiatan harian biasa: urusan rumah ringan, banyak duduk.' },
  { value: 'low_active', label: 'Sedikit aktif', desc: 'Kegiatan harian + 30–60 menit gerak sedang, mis. jalan cepat.' },
  { value: 'active', label: 'Aktif', desc: 'Kegiatan harian + lebih dari 60 menit gerak sedang tiap hari.' },
  { value: 'very_active', label: 'Sangat aktif', desc: 'Gerak sedang 60 menit + gerak berat, atau pekerjaan fisik berat.' },
];

const NUMBER_FIELDS: Array<{
  name: keyof MaternalProfile;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  help?: string;
}> = [
  { name: 'gestationalAgeWeeks', label: 'Usia kehamilan', unit: 'minggu', min: 0, max: 45, step: 1 },
  { name: 'maternalAgeYears', label: 'Usia Ibu', unit: 'tahun', min: 10, max: 60, step: 1 },
  { name: 'prepregnancyWeightKg', label: 'Berat sebelum hamil', unit: 'kg', min: 20, max: 300, step: 0.1, help: 'Lihat Buku KIA bila lupa.' },
  { name: 'currentWeightKg', label: 'Berat sekarang', unit: 'kg', min: 20, max: 300, step: 0.1, help: 'Hasil timbang terakhir.' },
  { name: 'heightCm', label: 'Tinggi badan', unit: 'cm', min: 100, max: 220, step: 0.1 },
];

const CONSTRAINTS: FoodConstraint[] = ['harga', 'sulit_diperoleh', 'pantangan', 'lainnya'];

const EMPTY_FOOD: FoodContext = {
  likedFoodKeys: [],
  dislikedFoodKeys: [],
  allergyFoodKeys: [],
  allergyDetail: '',
  constraints: [],
  tabooFoodKeys: [],
};

const DEFAULT_PROFILE: MaternalProfile = {
  maternalAgeYears: 27,
  heightCm: 158,
  prepregnancyWeightKg: 52,
  currentWeightKg: 59,
  gestationalAgeWeeks: 24,
  physicalActivityCategory: 'low_active',
};

function isValidActivity(v: unknown): v is PhysicalActivityCategory {
  return (
    v === 'inactive' || v === 'low_active' || v === 'active' || v === 'very_active'
  );
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === 'string');
}

/** Koersi aman: hanya number atau string numerik tak-kosong yang lolos; selain itu null. */
function toFiniteNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Gabungkan profil tersimpan ke prev — kolom tak-valid dibuang (pakai prev), tak pernah merge buta. */
function sanitizeStoredProfile(
  parsed: Partial<MaternalProfile> | null | undefined,
  prev: MaternalProfile,
): MaternalProfile {
  if (typeof parsed !== 'object' || parsed === null) return prev;
  const p = parsed as Record<string, unknown>;
  const num = (key: keyof MaternalProfile): number | undefined => {
    const n = toFiniteNumber(p[key as string]);
    return n == null ? undefined : n;
  };
  return {
    maternalAgeYears: num('maternalAgeYears') ?? prev.maternalAgeYears,
    heightCm: num('heightCm') ?? prev.heightCm,
    prepregnancyWeightKg: num('prepregnancyWeightKg') ?? prev.prepregnancyWeightKg,
    currentWeightKg: num('currentWeightKg') ?? prev.currentWeightKg,
    gestationalAgeWeeks: num('gestationalAgeWeeks') ?? prev.gestationalAgeWeeks,
    physicalActivityCategory: isValidActivity(p.physicalActivityCategory)
      ? p.physicalActivityCategory
      : prev.physicalActivityCategory,
  };
}

/** Gabungkan konteks pangan tersimpan — array harus array-of-string, string harus string. */
function sanitizeStoredFood(saved: Partial<FoodContext> | null | undefined): FoodContext {
  if (typeof saved !== 'object' || saved === null) return EMPTY_FOOD;
  const f = saved as Record<string, unknown>;
  const validConstraints = Array.isArray(f.constraints)
    ? (f.constraints as unknown[]).filter(
        (c): c is FoodConstraint =>
          c === 'harga' || c === 'sulit_diperoleh' || c === 'pantangan' || c === 'lainnya',
      )
    : EMPTY_FOOD.constraints;
  return {
    likedFoodKeys: isStringArray(f.likedFoodKeys) ? migrateFoodKeys(f.likedFoodKeys) : EMPTY_FOOD.likedFoodKeys,
    dislikedFoodKeys: isStringArray(f.dislikedFoodKeys)
      ? migrateFoodKeys(f.dislikedFoodKeys)
      : EMPTY_FOOD.dislikedFoodKeys,
    allergyFoodKeys: isStringArray(f.allergyFoodKeys)
      ? migrateFoodKeys(f.allergyFoodKeys)
      : EMPTY_FOOD.allergyFoodKeys,
    allergyDetail:
      typeof f.allergyDetail === 'string' ? f.allergyDetail : EMPTY_FOOD.allergyDetail,
    constraints: validConstraints,
    tabooFoodKeys: isStringArray(f.tabooFoodKeys) ? migrateFoodKeys(f.tabooFoodKeys) : EMPTY_FOOD.tabooFoodKeys,
  };
}

/** Validasi rentang sebelum hitung/simpan; kembalikan pesan error Indonesia atau null bila OK. */
function validateProfileForSubmit(p: MaternalProfile): string | null {
  const checks: Array<{ value: unknown; min: number; max: number; message: string }> = [
    { value: p.maternalAgeYears, min: 10, max: 60, message: 'Usia ibu harus antara 10–60 tahun.' },
    { value: p.heightCm, min: 100, max: 220, message: 'Tinggi badan harus antara 100–220 cm.' },
    { value: p.prepregnancyWeightKg, min: 20, max: 300, message: 'BB sebelum hamil harus antara 20–300 kg.' },
    { value: p.currentWeightKg, min: 20, max: 300, message: 'BB saat ini harus antara 20–300 kg.' },
    { value: p.gestationalAgeWeeks, min: 0, max: 45, message: 'Usia kehamilan harus antara 0–45 minggu.' },
  ];
  for (const c of checks) {
    if (typeof c.value !== 'number' || !Number.isFinite(c.value) || c.value < c.min || c.value > c.max) {
      return c.message;
    }
  }
  if (!isValidActivity(p.physicalActivityCategory)) {
    return 'Kategori aktivitas tidak valid.';
  }
  return null;
}

const ProfileInput: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<MaternalProfile>(DEFAULT_PROFILE);
  const [food, setFood] = useState<FoodContext>(EMPTY_FOOD);
  const [suggestOptions, setSuggestOptions] = useState<SuggestOption[]>([]);
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    const parsed = readJSON<Partial<MaternalProfile> & { age?: unknown; height?: unknown; weight?: unknown }>(
      STORAGE_KEYS.profile,
    );
    if (parsed && typeof parsed === 'object') {
      // Migrasi profil lama (age/height/weight) ke format MOCHI bila perlu:
      // koersi Number + finite check, merge di atas prev (jangan reset diam-diam).
      if (parsed.maternalAgeYears == null && parsed.age != null) {
        const age = toFiniteNumber(parsed.age);
        const height = toFiniteNumber(parsed.height);
        const weight = toFiniteNumber(parsed.weight);
        setProfile((prev) => ({
          ...prev,
          ...(age != null ? { maternalAgeYears: age } : {}),
          ...(height != null ? { heightCm: height } : {}),
          ...(weight != null ? { prepregnancyWeightKg: weight, currentWeightKg: weight } : {}),
        }));
      } else {
        setProfile((prev) => sanitizeStoredProfile(parsed, prev));
      }
    }
    const savedFood = readJSON<Partial<FoodContext>>(STORAGE_KEYS.food);
    const storedFood = savedFood && typeof savedFood === 'object' ? sanitizeStoredFood(savedFood) : EMPTY_FOOD;
    setFood(storedFood);
    loadMenuFoods()
      .then((foods) => {
        const options: SuggestOption[] = foods.map((f) => ({
          key: f.key,
          label: f.name,
          hint: FOOD_CATEGORY_LABELS[f.category],
        }));
        // Pilihan lama yang tidak ada lagi di daftar menu tetap ditampilkan (bisa dihapus ibu),
        // tidak dibuang diam-diam — terutama penting untuk alergi.
        const known = new Set(options.map((o) => o.key));
        const stored = [
          ...storedFood.likedFoodKeys,
          ...storedFood.dislikedFoodKeys,
          ...storedFood.allergyFoodKeys,
          ...storedFood.tabooFoodKeys,
        ];
        for (const key of new Set(stored)) {
          if (!known.has(key)) options.push({ key, label: fallbackFoodLabel(key), hint: 'tidak ada di menu' });
        }
        setSuggestOptions(options);
      })
      .catch(() => setSuggestOptions([]));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: name === 'physicalActivityCategory' ? (value as PhysicalActivityCategory) : Number(value),
    }));
  };

  const setFoodField = <K extends keyof FoodContext>(field: K, value: FoodContext[K]) => {
    setFood(prev => ({ ...prev, [field]: value }));
  };

  const toggleConstraint = (c: FoodConstraint) => {
    setFood(prev => ({
      ...prev,
      constraints: prev.constraints.includes(c)
        ? prev.constraints.filter(x => x !== c)
        : [...prev.constraints, c],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    // Validasi dulu (tolak 0/NaN/diluar rentang) sebelum menghitung/menyimpan apa pun.
    const validationError = validateProfileForSubmit(profile);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    let result: ReturnType<typeof NutritionCalculator.calculateMochi>;
    try {
      result = NutritionCalculator.calculateMochi(profile);
    } catch {
      setSubmitError('Gagal menghitung kebutuhan gizi. Periksa kembali data profil.');
      return;
    }
    try {
      const okProfile = saveStored(STORAGE_KEYS.profile, JSON.stringify(profile));
      const okFood = saveStored(STORAGE_KEYS.food, JSON.stringify(food));
      const okResult = saveStored(STORAGE_KEYS.result, JSON.stringify(result));
      const okNeeds = saveStored(STORAGE_KEYS.needs, JSON.stringify(result.gaTarget));
      if (!okProfile || !okFood || !okResult || !okNeeds) {
        setSubmitError('Gagal menyimpan di perangkat ini (mode privat/penyimpanan penuh).');
        return;
      }
    } catch {
      setSubmitError('Gagal menyimpan di perangkat ini (mode privat/penyimpanan penuh).');
      return;
    }
    navigate('/needs');
  };

  const handleWipe = () => {
    if (!window.confirm('Hapus seluruh data Mochi di perangkat ini? Tindakan ini tidak bisa dibatalkan.')) return;
    const wiped = clearAllStored();
    if (wiped) {
      setProfile(DEFAULT_PROFILE);
      setFood(EMPTY_FOOD);
      setSubmitError('');
    } else {
      setSubmitError('Gagal menghapus seluruh data di perangkat ini. Coba lagi.');
    }
  };

  return (
    <main className="container page page-narrow">
      <div className="page-head">
        <span className="kicker">Langkah 1 dari 4</span>
        <h1>Profil Ibu</h1>
        <p>Angka-angka ini dipakai untuk menghitung kebutuhan gizi harian. Perkiraan juga tidak apa-apa — bisa diubah kapan saja.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset className="form-section">
          <legend>
            <span className="section-num">1</span> Tentang kehamilan Ibu
          </legend>
          <p className="form-hint">Berat sebelum hamil dipakai untuk menghitung IMT, bukan berat sekarang.</p>

          <div className="form-grid">
            {NUMBER_FIELDS.map((f) => (
              <div className="field" key={f.name}>
                <label className="field-label" htmlFor={f.name}>
                  {f.label}
                </label>
                <div className="input-unit">
                  <input
                    id={f.name}
                    type="number"
                    inputMode="decimal"
                    name={f.name}
                    value={profile[f.name] as number}
                    onChange={handleChange}
                    required
                    min={f.min}
                    max={f.max}
                    step={f.step}
                  />
                  <span>{f.unit}</span>
                </div>
                {f.help && <span className="field-help">{f.help}</span>}
              </div>
            ))}
          </div>

          <div className="field activity-field" role="radiogroup" aria-labelledby="activity-label">
            <span className="field-label" id="activity-label">
              Seberapa aktif Ibu sehari-hari?
            </span>
            <div className="activity-options">
              {ACTIVITY_OPTIONS.map((o) => {
                const checked = profile.physicalActivityCategory === o.value;
                return (
                  <label key={o.value} className={`activity-option${checked ? ' checked' : ''}`}>
                    <input
                      type="radio"
                      name="physicalActivityCategory"
                      value={o.value}
                      checked={checked}
                      onChange={handleChange}
                    />
                    <strong>
                      {o.label}
                    </strong>
                    <span>{o.desc}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>
            <span className="section-num">2</span> Soal makanan
          </legend>
          <p className="form-hint">Ketik beberapa huruf, lalu pilih dari daftar. Boleh dikosongkan.</p>

          <div className="form-grid">
            <AutocompleteMulti
              label="Yang Ibu suka"
              options={suggestOptions}
              values={food.likedFoodKeys}
              onChange={(v) => setFoodField('likedFoodKeys', v)}
              placeholder="mis. tempe, pepes ikan"
            />

            <AutocompleteMulti
              label="Yang tidak suka / dihindari"
              options={suggestOptions}
              values={food.dislikedFoodKeys}
              onChange={(v) => setFoodField('dislikedFoodKeys', v)}
              placeholder="mis. jengkol"
            />

            <div className="field">
              <AutocompleteMulti
                label="Alergi makanan"
                options={suggestOptions}
                values={food.allergyFoodKeys}
                onChange={(v) => setFoodField('allergyFoodKeys', v)}
                placeholder="mis. udang"
              />
              {food.allergyFoodKeys.length > 0 && (
                <input
                  type="text"
                  value={food.allergyDetail}
                  onChange={(e) => setFoodField('allergyDetail', e.target.value)}
                  placeholder="Reaksinya seperti apa? (gatal, bengkak, sesak)"
                  aria-label="Keterangan alergi"
                />
              )}
            </div>

            <div className="field">
              <span className="field-label">Kendala</span>
              <div className="chip-row">
                {CONSTRAINTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="chip-toggle"
                    onClick={() => toggleConstraint(c)}
                    aria-pressed={food.constraints.includes(c)}
                  >
                    {FOOD_CONSTRAINT_LABELS[c]}
                  </button>
                ))}
              </div>
              {food.constraints.includes('pantangan') && (
                <div style={{ marginTop: '0.75rem' }}>
                  <AutocompleteMulti
                    label="Pantang makan apa?"
                    options={suggestOptions}
                    values={food.tabooFoodKeys}
                    onChange={(v) => setFoodField('tabooFoodKeys', v)}
                    placeholder="Ketik makanan yang dipantang"
                  />
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {submitError && (
          <p role="alert" className="form-error">
            {submitError}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-block">
            Hitung kebutuhan gizi
          </button>
        </div>
        <p className="privacy-line">
          Data hanya tersimpan di perangkat ini.{' '}
          <button type="button" className="text-button" onClick={handleWipe}>
            Hapus semua data saya
          </button>
        </p>
      </form>
    </main>
  );
};

export default ProfileInput;
