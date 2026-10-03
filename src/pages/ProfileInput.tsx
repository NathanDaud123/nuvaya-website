import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FoodConstraint, FoodContext, MaternalProfile, PhysicalActivityCategory } from '../models/types';
import { FOOD_CONSTRAINT_LABELS } from '../models/types';
import { NutritionCalculator } from '../services/NutritionCalculator';
import { FOOD_CATEGORY_LABELS, flatFoodOptions, loadFoodLibrary } from '../services/FoodDatabase';
import { STORAGE_KEYS, loadStored, saveStored } from '../services/storage';
import AutocompleteMulti, { type SuggestOption } from '../components/AutocompleteMulti';

const ACTIVITY_OPTIONS: Array<{ value: PhysicalActivityCategory; label: string }> = [
  { value: 'inactive', label: 'Inactive (aktivitas sangat rendah)' },
  { value: 'low_active', label: 'Low Active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
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

const ProfileInput: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<MaternalProfile>({
    maternalAgeYears: 27,
    heightCm: 158,
    prepregnancyWeightKg: 52,
    currentWeightKg: 59,
    gestationalAgeWeeks: 24,
    physicalActivityCategory: 'low_active',
  });
  const [food, setFood] = useState<FoodContext>(EMPTY_FOOD);
  const [suggestOptions, setSuggestOptions] = useState<SuggestOption[]>([]);

  useEffect(() => {
    const saved = loadStored(STORAGE_KEYS.profile);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrasi profil lama (age/height/weight) ke format MOCHI bila perlu
        if (parsed.maternalAgeYears == null && parsed.age != null) {
          setProfile({
            maternalAgeYears: parsed.age,
            heightCm: parsed.height,
            prepregnancyWeightKg: parsed.weight,
            currentWeightKg: parsed.weight,
            gestationalAgeWeeks: 24,
            physicalActivityCategory: 'low_active',
          });
        } else {
          setProfile(parsed);
        }
      } catch {
        /* abaikan cache rusak */
      }
    }
    const savedFood = loadStored(STORAGE_KEYS.food);
    if (savedFood) {
      try {
        setFood({ ...EMPTY_FOOD, ...JSON.parse(savedFood) });
      } catch {
        /* abaikan cache rusak */
      }
    }
    loadFoodLibrary().then((lib) => {
      setSuggestOptions(
        flatFoodOptions(lib).map((o) => ({
          key: o.key,
          label: o.menu,
          hint: FOOD_CATEGORY_LABELS[o.category],
        })),
      );
    });
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
    saveStored(STORAGE_KEYS.profile, JSON.stringify(profile));
    saveStored(STORAGE_KEYS.food, JSON.stringify(food));
    const result = NutritionCalculator.calculateMochi(profile);
    saveStored(STORAGE_KEYS.result, JSON.stringify(result));
    saveStored(STORAGE_KEYS.needs, JSON.stringify(result.gaTarget));
    navigate('/needs');
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
      <div className="highlight-panel" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', backdropFilter: 'blur(10px)' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Profil Ibu</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--text-light)' }}>
          Data diri dan preferensi makanan untuk menghitung kebutuhan gizi harian yang tepat.
        </p>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Usia Ibu (tahun)</label>
              <input type="number" name="maternalAgeYears" value={profile.maternalAgeYears} onChange={handleChange} required min="10" max="60" step="1" />
            </div>

            <div className="form-group">
              <label>Usia Kehamilan (minggu)</label>
              <input type="number" name="gestationalAgeWeeks" value={profile.gestationalAgeWeeks} onChange={handleChange} required min="0" max="45" step="1" />
            </div>

            <div className="form-group">
              <label>Tinggi Badan (cm)</label>
              <input type="number" name="heightCm" value={profile.heightCm} onChange={handleChange} required min="100" max="220" step="0.1" />
            </div>

            <div className="form-group">
              <label>BB Sebelum Hamil (kg)</label>
              <input type="number" name="prepregnancyWeightKg" value={profile.prepregnancyWeightKg} onChange={handleChange} required min="20" max="300" step="0.1" />
            </div>

            <div className="form-group">
              <label>BB Saat Ini (kg)</label>
              <input type="number" name="currentWeightKg" value={profile.currentWeightKg} onChange={handleChange} required min="20" max="300" step="0.1" />
            </div>

            <div className="form-group">
              <label>Kategori Aktivitas (DRI 2023)</label>
              <select name="physicalActivityCategory" value={profile.physicalActivityCategory} onChange={handleChange}>
                {ACTIVITY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <h3 style={{ marginTop: '2.5rem', marginBottom: '0.25rem', color: 'var(--primary)' }}>Preferensi Makanan</h3>
          <p style={{ marginBottom: '1rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Ketik nama makanan, pilih dari saran yang muncul.
          </p>

          <div className="form-grid">
            <AutocompleteMulti
              label="Saya suka"
              options={suggestOptions}
              values={food.likedFoodKeys}
              onChange={(v) => setFoodField('likedFoodKeys', v)}
              placeholder="Ketik makanan yang disukai..."
            />

            <AutocompleteMulti
              label="Saya tidak suka / hindari"
              options={suggestOptions}
              values={food.dislikedFoodKeys}
              onChange={(v) => setFoodField('dislikedFoodKeys', v)}
              placeholder="Ketik makanan yang dihindari..."
            />

            <div>
              <AutocompleteMulti
                label="Alergi makanan"
                options={suggestOptions}
                values={food.allergyFoodKeys}
                onChange={(v) => setFoodField('allergyFoodKeys', v)}
                placeholder="Ketik makanan penyebab alergi..."
              />
              {food.allergyFoodKeys.length > 0 && (
                <input
                  type="text"
                  value={food.allergyDetail}
                  onChange={(e) => setFoodField('allergyDetail', e.target.value)}
                  placeholder="Keterangan alergi (mis. gatal, bengkak)"
                  style={{ marginTop: '0.5rem', width: '100%', boxSizing: 'border-box' }}
                />
              )}
            </div>

            <div className="form-group" style={{ gap: '0.4rem' }}>
              <label>Kendala</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {CONSTRAINTS.map((c) => {
                  const active = food.constraints.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleConstraint(c)}
                      aria-pressed={active}
                      style={{
                        padding: '0.4rem 0.9rem',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                        background: active ? 'var(--primary)' : 'transparent',
                        color: active ? '#fff' : 'inherit',
                        fontSize: '0.9rem',
                      }}
                    >
                      {FOOD_CONSTRAINT_LABELS[c]}
                    </button>
                  );
                })}
              </div>
              {food.constraints.includes('pantangan') && (
                <div style={{ marginTop: '0.75rem' }}>
                  <AutocompleteMulti
                    label="Pantang makanan apa"
                    options={suggestOptions}
                    values={food.tabooFoodKeys}
                    onChange={(v) => setFoodField('tabooFoodKeys', v)}
                    placeholder="Ketik makanan yang dipantang..."
                  />
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '2rem', width: '100%' }}>
            Hitung Kebutuhan Gizi
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileInput;
