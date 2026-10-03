import React, { useState } from 'react';
import { Apple, Salad, Pill, Beef, Milk, ChevronDown, CircleCheck } from 'lucide-react';
import { EDUCATION_MODULES } from '../data/education';

type IconType = React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;

const META: Record<string, { icon: IconType; bg: string; color: string }> = {
  'EDU-IRON': { icon: Beef, bg: '#fef2f2', color: '#dc2626' },
  'EDU-IFA': { icon: Pill, bg: '#eff6ff', color: '#2563eb' },
  'EDU-DIVERSITY': { icon: Salad, bg: '#f0fdf4', color: '#059669' },
  'EDU-PROTEIN': { icon: Apple, bg: '#fffbeb', color: '#d97706' },
  'EDU-CALCIUM-FOLATE': { icon: Milk, bg: '#faf5ff', color: '#7c3aed' },
};

const FALLBACK_META = { icon: Apple as IconType, bg: '#f0fdf4', color: '#059669' };

const Education: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(EDUCATION_MODULES[0].id);

  return (
    <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
      <div className="section-header">
        <span className="eyebrow">Belajar gizi</span>
        <h2>Edukasi Gizi</h2>
        <p>{EDUCATION_MODULES.length} modul bacaan singkat sesuai kebutuhan ibu hamil.</p>
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
                <span className="edu-icon" style={{ background: meta.bg, color: meta.color }}>
                  <Icon size={26} strokeWidth={1.75} />
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
                    <li key={i}>
                      <CircleCheck size={18} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Education;
