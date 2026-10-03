import React, { useMemo, useRef, useState } from 'react';

export interface SuggestOption {
  key: string;
  label: string;
  hint?: string;
}

interface Props {
  label: string;
  options: SuggestOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

/**
 * Pilihan terstandar model ketik-dulu: ketik awalan → muncul saran →
 * pilih → jadi chip. Tidak menampilkan seluruh daftar sekaligus.
 */
const AutocompleteMulti: React.FC<Props> = ({ label, options, values, onChange, placeholder }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<number | null>(null);

  const labelByKey = useMemo(() => new Map(options.map((o) => [o.key, o])), [options]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    return options
      .filter((o) => !values.includes(o.key) && o.label.toLowerCase().includes(q))
      .slice(0, 8);
  }, [options, values, query]);

  const add = (key: string) => {
    if (!values.includes(key)) onChange([...values, key]);
    setQuery('');
    setOpen(false);
  };

  const remove = (key: string) => {
    onChange(values.filter((v) => v !== key));
  };

  return (
    <div className="form-group" style={{ gap: '0.4rem' }}>
      <label>{label}</label>
      {values.length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {values.map((v) => (
          <span
            key={v}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.6rem',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              background: 'var(--glass-bg)',
              fontSize: '0.85rem',
            }}
          >
            {labelByKey.get(v)?.label ?? v}
            <button
              type="button"
              onClick={() => remove(v)}
              aria-label={`Hapus ${labelByKey.get(v)?.label ?? v}`}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700 }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          style={{ width: '100%', boxSizing: 'border-box' }}
          value={query}
          placeholder={placeholder ?? 'Ketik nama makanan...'}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && suggestions.length > 0) {
              e.preventDefault();
              add(suggestions[0].key);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        {open && suggestions.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              zIndex: 20,
              left: 0,
              right: 0,
              margin: 0,
              padding: 0,
              listStyle: 'none',
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              maxHeight: '12rem',
              overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            }}
          >
            {suggestions.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (blurTimer.current) window.clearTimeout(blurTimer.current);
                    add(s.key);
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>{s.label}</span>
                  {s.hint && <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>{s.hint}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AutocompleteMulti;
