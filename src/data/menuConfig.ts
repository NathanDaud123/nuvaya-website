/**
 * Konfigurasi mesin menu MOCHI (bukan angka klinis — aturan penyusunan menu).
 * Semua bobot/porsi di sini masih draf: TODO (NUTRITION REVIEW).
 */
import type { MenuCategory } from './menuFoods';

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
  pokok: 'Makanan pokok',
  hewani: 'Lauk hewani',
  nabati: 'Lauk nabati',
  sayur: 'Sayur',
  buah: 'Buah',
  selingan: 'Selingan',
};

export type MealKey = 'sarapan' | 'selingan_pagi' | 'siang' | 'selingan_sore' | 'malam';

export interface MealSlot {
  /** Kategori yang boleh mengisi slot ini (selingan boleh buah atau kudapan). */
  categories: MenuCategory[];
}

/** 3 kali makan + 2 kali selingan. */
export const MEAL_PLAN: Array<{ key: MealKey; label: string; slots: MealSlot[] }> = [
  {
    key: 'sarapan',
    label: 'Sarapan',
    slots: [{ categories: ['pokok'] }, { categories: ['hewani'] }, { categories: ['nabati'] }, { categories: ['sayur'] }],
  },
  { key: 'selingan_pagi', label: 'Selingan pagi', slots: [{ categories: ['buah', 'selingan'] }] },
  {
    key: 'siang',
    label: 'Makan siang',
    slots: [
      { categories: ['pokok'] },
      { categories: ['hewani'] },
      { categories: ['nabati'] },
      { categories: ['sayur'] },
      { categories: ['buah'] },
    ],
  },
  { key: 'selingan_sore', label: 'Selingan sore', slots: [{ categories: ['buah', 'selingan'] }] },
  {
    key: 'malam',
    label: 'Makan malam',
    slots: [
      { categories: ['pokok'] },
      { categories: ['hewani'] },
      { categories: ['nabati'] },
      { categories: ['sayur'] },
      { categories: ['buah'] },
    ],
  },
];

/** Kelipatan porsi yang boleh dipilih per kategori (1 = satu porsi di menuFoods). */
export const PORTION_STEPS: Record<MenuCategory, number[]> = {
  pokok: [1, 1.5, 2, 2.5],
  hewani: [1, 1.5, 2],
  nabati: [1, 1.5, 2],
  sayur: [1, 1.5, 2],
  buah: [1, 1.5, 2],
  selingan: [1, 1.5, 2],
};

/**
 * Bobot fungsi fitness (simpangan relatif terhadap target).
 * Energi dijaga dua arah; zat besi, kalsium, seng, vitamin C, tiamin, dan serat hanya dihukum bila KURANG.
 */
export const FITNESS_WEIGHTS = {
  energy: 4,
  proteinUnder: 2,
  proteinOver: 0.5,
  carbs: 1,
  fat: 1,
  fiberUnder: 0.5,
  ironUnder: 1,
  calciumUnder: 1,
  zincUnder: 0.5,
  vitCUnder: 0.5,
  /**
   * Tiamin (B1): naik +0,3 mg saat hamil, pola makan nasi putih rawan kurang B1, dan datanya
   * hampir lengkap di TKPI. Riboflavin, niasin, fosfor, kalium, tembaga, natrium sengaja
   * TIDAK masuk fitness (data kosong di banyak masakan / tidak naik saat hamil) — hanya ditampilkan.
   */
  thiaminUnder: 0.5,
  /** besi/kalsium di atas target x MICRO_OVER_FACTOR (aturan moderasi R33 belum ditetapkan) */
  microOver: 0.5,
  /** per makanan pokok selain nasi, mulai yang kedua dalam sehari */
  altStaple: 0.1,
  /** per makanan yang muncul lebih dari sekali dalam sehari */
  repeat: 0.15,
  /** bonus per makanan yang disukai ibu (dikurangkan dari penalti) */
  liked: 0.05,
};

/** Makanan yang wajar muncul di setiap waktu makan, tidak dihukum karena berulang. */
export const REPEAT_OK_CODES = ['AP001'];

/** Makanan pokok utama; pengganti (ubi, roti, mi, ...) cukup sekali sehari. */
export const PRIMARY_STAPLE_CODES = ['AP001'];

export const MICRO_OVER_FACTOR = 1.5;

export const GA_PARAMS = {
  populationSize: 60,
  generations: 150,
  mutationRate: 0.15,
  crossoverRate: 0.8,
  tournamentSize: 3,
  elitism: 2,
};

/** Rasio (4P + 4KH + 9L) / energi di luar rentang ini → data TKPI dianggap janggal, makanan tidak dipakai. */
export const ATWATER_SANITY = { min: 0.7, max: 1.5 };
