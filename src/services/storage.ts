/** Kunci penyimpanan lokal Mochi (dulu `nuvaya_*` — otomatis dimigrasi sekali). */
export const STORAGE_KEYS = {
  profile: 'mochi_profile',
  food: 'mochi_food',
  result: 'mochi_result',
  needs: 'mochi_needs',
  targets: 'mochi_targets',
} as const;

const LEGACY_KEYS: Record<string, string> = {
  mochi_profile: 'nuvaya_profile',
  mochi_food: 'nuvaya_food',
  mochi_result: 'nuvaya_mochi',
  mochi_needs: 'nuvaya_needs',
};

/** Baca dengan fallback migrasi dari kunci lama. */
export function loadStored(key: string): string | null {
  const current = localStorage.getItem(key);
  if (current != null) return current;
  const legacy = LEGACY_KEYS[key];
  if (!legacy) return null;
  const old = localStorage.getItem(legacy);
  if (old != null) {
    localStorage.setItem(key, old);
    localStorage.removeItem(legacy);
  }
  return old;
}

export function saveStored(key: string, value: string): void {
  localStorage.setItem(key, value);
}
