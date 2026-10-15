import React, { useState } from 'react';
import { Apple, Salad, Pill, Beef, Milk, ChevronDown } from 'lucide-react';
import { EDUCATION_MODULES } from '../data/education';

type IconType = React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;

const META: Record<string, { icon: IconType; bg: string }> = {
  'EDU-IRON': { icon: Beef, bg: 'var(--mochi)' },
  'EDU-IFA': { icon: Pill, bg: 'var(--mochi-wash)' },
  'EDU-DIVERSITY': { icon: Salad, bg: 'var(--matcha-wash)' },
  'EDU-PROTEIN': { icon: Apple, bg: 'var(--kunyit-wash)' },
  'EDU-CALCIUM-FOLATE': { icon: Milk, bg: 'var(--paper-deep)' },
};

const FALLBACK_META = { icon: Apple as IconType, bg: 'var(--matcha-wash)' };

const Education: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(EDUCATION_MODULES[0].id);

  return (
    <main className="container page page-narrow">
      <div className="page-head">
        <span className="kicker">Bacaan singkat</span>
        <h1>Edukasi gizi</h1>
        <p>
          {EDUCATION_MODULES.length} catatan pendek tentang zat gizi yang paling sering kurang selama hamil. Masing-masing
          bisa dibaca kurang dari satu menit.
        </p>
      </div>

      <div className="edu-list">
        {EDUCATION_MODULES.map((m) => {
          const open = openId === m.id;
          const meta = META[m.id] ?? FALLBACK_META;
          const Icon = meta.icon;
          return (
            <div key={m.id} className={`edu-card${open ? ' open' : ''}`}>
              <button
                type="button"
                className="edu-head"
                onClick={() => setOpenId(open ? null : m.id)}
                aria-expanded={open}
              >
                <span className="edu-icon" style={{ background: meta.bg }}>
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span className="edu-titles">
                  <span className="edu-pill">{m.nutrient}</span>
                  <strong>{m.title}</strong>
                </span>
                <ChevronDown size={20} className="edu-chevron" />
              </button>
              {open && (
                <ul className="edu-points">
                  {m.body.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default Education;
