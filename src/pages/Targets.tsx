import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, readJSON, saveStored } from '../services/storage';

type Difficulty = 'mudah' | 'lumayan' | 'sulit';

interface WeeklyTargets {
  target1: string;
  target2: string;
  ifaAdherence: boolean;
  difficulty: Difficulty | '';
  done1: boolean;
  done2: boolean;
  doneIfa: boolean;
}

const EMPTY: WeeklyTargets = {
  target1: '',
  target2: '',
  ifaAdherence: true,
  difficulty: '',
  done1: false,
  done2: false,
  doneIfa: false,
};

const DIFFICULTY_OPTIONS: Array<{ value: Difficulty; label: string }> = [
  { value: 'mudah', label: 'Mudah' },
  { value: 'lumayan', label: 'Lumayan sulit' },
  { value: 'sulit', label: 'Sulit' },
];

/** Cache rusak (mis. '"hi"', array, tipe kolom salah) tak boleh meracuni state form. */
function sanitizeTargets(stored: unknown): WeeklyTargets | null {
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return null;
  const s = stored as Record<string, unknown>;
  return {
    target1: typeof s.target1 === 'string' ? s.target1 : EMPTY.target1,
    target2: typeof s.target2 === 'string' ? s.target2 : EMPTY.target2,
    ifaAdherence: typeof s.ifaAdherence === 'boolean' ? s.ifaAdherence : EMPTY.ifaAdherence,
    difficulty:
      s.difficulty === 'mudah' || s.difficulty === 'lumayan' || s.difficulty === 'sulit'
        ? s.difficulty
        : EMPTY.difficulty,
    done1: typeof s.done1 === 'boolean' ? s.done1 : EMPTY.done1,
    done2: typeof s.done2 === 'boolean' ? s.done2 : EMPTY.done2,
    doneIfa: typeof s.doneIfa === 'boolean' ? s.doneIfa : EMPTY.doneIfa,
  };
}

const Targets: React.FC = () => {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<WeeklyTargets>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string>('');

  useEffect(() => {
    const stored = readJSON<Partial<WeeklyTargets>>(STORAGE_KEYS.targets);
    const clean = sanitizeTargets(stored);
    if (clean) {
      setTargets(clean);
      setSaved(true);
    }
  }, []);

  const set = <K extends keyof WeeklyTargets>(field: K, value: WeeklyTargets[K]) => {
    setTargets((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    const ok = saveStored(STORAGE_KEYS.targets, JSON.stringify(targets));
    if (ok) {
      setSaved(true);
    } else {
      setSaved(false);
      setSaveError('Gagal menyimpan target di perangkat ini (mode privat/penyimpanan penuh).');
    }
  };

  return (
    <main className="container page page-narrow">
      <div className="page-head">
        <span className="kicker">Langkah 4 dari 4</span>
        <h1>Target minggu ini</h1>
        <p>Cukup satu-dua hal kecil yang realistis. Centang kalau sudah jalan, lalu ceritakan seberapa susah.</p>
      </div>

      <form onSubmit={handleSubmit} className="target-sheet">
        <div className="target-item">
          <span className="target-num">1</span>
          <div className="field">
            <label className="field-label" htmlFor="target1">
              Target makan pertama
            </label>
            <input
              id="target1"
              type="text"
              value={targets.target1}
              onChange={(e) => set('target1', e.target.value)}
              placeholder="mis. tambah 1 lauk hewani tiap makan siang"
            />
            <label className="check">
              <input type="checkbox" checked={targets.done1} onChange={(e) => set('done1', e.target.checked)} />
              Sudah dilakukan
            </label>
          </div>
        </div>

        <div className="target-item">
          <span className="target-num">2</span>
          <div className="field">
            <label className="field-label" htmlFor="target2">
              Target makan kedua
            </label>
            <input
              id="target2"
              type="text"
              value={targets.target2}
              onChange={(e) => set('target2', e.target.value)}
              placeholder="mis. makan buah setiap hari"
            />
            <label className="check">
              <input type="checkbox" checked={targets.done2} onChange={(e) => set('done2', e.target.checked)} />
              Sudah dilakukan
            </label>
          </div>
        </div>

        <div className="target-item">
          <span className="target-num">3</span>
          <div className="field">
            <label className="check" style={{ marginTop: 0 }}>
              <input
                type="checkbox"
                checked={targets.ifaAdherence}
                onChange={(e) => set('ifaAdherence', e.target.checked)}
              />
              <span className="field-label">Minum tablet tambah darah (TTD) sesuai anjuran</span>
            </label>
            {targets.ifaAdherence && (
              <label className="check">
                <input type="checkbox" checked={targets.doneIfa} onChange={(e) => set('doneIfa', e.target.checked)} />
                Sudah rutin minggu ini
              </label>
            )}
          </div>
        </div>

        <div className="field" style={{ marginTop: '1.5rem' }}>
          <span className="field-label" id="difficulty-label">
            Bagaimana menjalankannya?
          </span>
          <div className="segmented" role="group" aria-labelledby="difficulty-label">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => set('difficulty', d.value)}
                aria-pressed={targets.difficulty === d.value}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-block">
            Simpan target
          </button>
        </div>
        {saved && <p className="saved-line">Tersimpan di perangkat ini.</p>}
        {saveError && (
          <p role="alert" className="form-error">
            {saveError}
          </p>
        )}
      </form>

      <p style={{ marginTop: '1.5rem' }}>
        <button type="button" className="text-button link-arrow" onClick={() => navigate('/recommendation')}>
          Kembali ke menu hari ini
        </button>
      </p>
    </main>
  );
};

export default Targets;
