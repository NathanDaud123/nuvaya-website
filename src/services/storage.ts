/**
 * Kunci penyimpanan lokal Mochi (dulu `nuvaya_*` — otomatis dimigrasi sekali).
 * Data kesehatan tersimpan HANYA di browser perangkat (tidak dikirim ke server).
 */
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
  mochi_targets: 'nuvaya_targets',
};

/** localStorage bisa melempar di mode privat / kuota penuh — jangan pernah crash karenanya. */
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* abaikan */
  }
}

/** Baca dengan fallback migrasi dari kunci lama. */
export function loadStored(key: string): string | null {
  const current = safeGet(key);
  if (current != null) return current;
  const legacy = LEGACY_KEYS[key];
  if (!legacy) return null;
  const old = safeGet(legacy);
  if (old == null) return null;
  // Tulis ulang ke kunci baru. Bila gagal (kuota/mode privat),
  // kembalikan isi lama TANPA menghapus kunci legacy (satu-satunya salinan baik).
  try {
    localStorage.setItem(key, old);
  } catch {
    return old;
  }
  // Hapus legacy hanya setelah verifikasi baca-balik cocok.
  if (safeGet(key) === old) {
    safeRemove(legacy);
  }
  return old;
}

export function saveStored(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** JSON.parse yang tidak pernah melempar — cache rusak = null, bukan crash. */
export function readJSON<T>(key: string): T | null {
  const raw = loadStored(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Hapus SELURUH data Mochi di perangkat (termasuk sisa kunci lama).
 * Mengembalikan true hanya bila SETIAP kunci (baru + legacy) terverifikasi hilang.
 */
export function clearAllStored(): boolean {
  Object.values(STORAGE_KEYS).forEach(safeRemove);
  Object.values(LEGACY_KEYS).forEach(safeRemove);
  const allKeys = [...Object.values(STORAGE_KEYS), ...Object.values(LEGACY_KEYS)];
  return allKeys.every((k) => {
    try {
      return localStorage.getItem(k) == null;
    } catch {
      return false;
    }
  });
}
