import React, { useId, useMemo, useRef, useState } from 'react';

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
  const inputId = useId();

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
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      {values.length > 0 && (
        <div className="ac-chips">
          {values.map((v) => (
            <span key={v} className="ac-chip">
              {labelByKey.get(v)?.label ?? v}
              <button type="button" onClick={() => remove(v)} aria-label={`Hapus ${labelByKey.get(v)?.label ?? v}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="ac-input">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
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
          <ul className="ac-list">
            {suggestions.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  className="ac-option"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (blurTimer.current) window.clearTimeout(blurTimer.current);
                    add(s.key);
                  }}
                >
                  <span>{s.label}</span>
                  {s.hint && <span className="ac-hint">{s.hint}</span>}
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
