import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, loadStored, saveStored } from '../services/storage';

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

const Targets: React.FC = () => {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<WeeklyTargets>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = loadStored(STORAGE_KEYS.targets);
    if (raw) {
      try {
        setTargets({ ...EMPTY, ...JSON.parse(raw) });
        setSaved(true);
      } catch {
        /* abaikan cache rusak */
      }
    }
  }, []);

  const set = <K extends keyof WeeklyTargets>(field: K, value: WeeklyTargets[K]) => {
    setTargets((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveStored(STORAGE_KEYS.targets, JSON.stringify(targets));
    setSaved(true);
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
      <div
        className="highlight-panel"
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', backdropFilter: 'blur(10px)' }}
      >
        <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Target Saya Minggu Ini</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--text-light)' }}>
          Pilih target sederhana yang mau dicoba minggu ini. Hasilnya dipakai untuk penyesuaian berikutnya.
        </p>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Target makan 1</label>
            <input
              type="text"
              value={targets.target1}
              onChange={(e) => set('target1', e.target.value)}
              placeholder="Mis. tambah 1 lauk hewani tiap makan siang"
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400 }}>
              <input type="checkbox" checked={targets.done1} onChange={(e) => set('done1', e.target.checked)} />
              Sudah dilakukan
            </label>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Target makan 2</label>
            <input
              type="text"
              value={targets.target2}
              onChange={(e) => set('target2', e.target.value)}
              placeholder="Mis. makan buah setiap hari"
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400 }}>
              <input type="checkbox" checked={targets.done2} onChange={(e) => set('done2', e.target.checked)} />
              Sudah dilakukan
            </label>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={targets.ifaAdherence}
                onChange={(e) => set('ifaAdherence', e.target.checked)}
              />
              Minum TTD sesuai anjuran
            </label>
            {targets.ifaAdherence && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400 }}>
                <input type="checkbox" checked={targets.doneIfa} onChange={(e) => set('doneIfa', e.target.checked)} />
                Sudah dilakukan minggu ini
              </label>
            )}
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Bagaimana menjalankannya?</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {DIFFICULTY_OPTIONS.map((d) => {
                const active = targets.difficulty === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => set('difficulty', d.value)}
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
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '2rem', width: '100%' }}>
            Simpan Target
          </button>
          {saved && (
            <p style={{ marginTop: '1rem', color: 'var(--primary)', textAlign: 'center' }}>
              Target tersimpan.
            </p>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button type="button" className="btn-outline" onClick={() => navigate('/recommendation')}>
            Kembali ke Rekomendasi
          </button>
        </div>
      </div>
    </div>
  );
};

export default Targets;
