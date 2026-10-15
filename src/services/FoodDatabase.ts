import Papa from 'papaparse';
import { ATWATER_SANITY, MENU_CATEGORY_LABELS } from '../data/menuConfig';
import { LEGACY_FOOD_KEY_MAP, type Allergen, type MenuCategory } from '../data/menuFoods';

/** Lima CSV menu dari TKPI 2017 (lihat scripts/build_menu_csv.py). CSV lama rec_source_* tidak dipakai. */
const MENU_CSV_FILES = ['tkpi_staple', 'tkpi_animal', 'tkpi_plant', 'tkpi_vegetable', 'tkpi_side'];

const CATEGORIES: MenuCategory[] = ['pokok', 'hewani', 'nabati', 'sayur', 'buah', 'selingan'];
const ALLERGENS: Allergen[] = ['telur', 'susu', 'ikan', 'udang', 'kacang_tanah', 'kedelai', 'gandum'];

/**
 * Zat gizi yang dijumlahkan mesin menu → kolom CSV per 100 g BDD (folat tidak ada di TKPI 2017).
 * Tidak semuanya masuk fungsi fitness — lihat FITNESS_WEIGHTS di menuConfig.
 */
const NUTRIENT_COLUMNS = {
  energy: 'energi_kkal_per100g',
  protein: 'protein_g_per100g',
  carbs: 'karbohidrat_g_per100g',
  fat: 'lemak_g_per100g',
  fiber: 'serat_g_per100g',
  iron: 'besi_mg_per100g',
  calcium: 'kalsium_mg_per100g',
  zinc: 'seng_mg_per100g',
  vitC: 'vitamin_c_mg_per100g',
  thiamin: 'thiamin_mg_per100g',
  riboflavin: 'riboflavin_mg_per100g',
  niacin: 'niasin_mg_per100g',
  phosphorus: 'fosfor_mg_per100g',
  potassium: 'kalium_mg_per100g',
  sodium: 'natrium_mg_per100g',
  // Tembaga tidak dipakai: sebagian baris TKPI (mis. apel 124,2; jeruk manis 160) tampaknya
  // tercetak dalam µg padahal kolomnya mg. TODO (NUTRITION REVIEW).
} as const;

export type MenuNutrient = keyof typeof NUTRIENT_COLUMNS;
export const MENU_NUTRIENTS = Object.keys(NUTRIENT_COLUMNS) as MenuNutrient[];

export interface MenuFood {
  /** Id standar `tkpi:<kode>` — dipakai di suka, tidak suka, alergi, pantangan */
  key: string;
  code: string;
  name: string;
  tkpiName: string;
  category: MenuCategory;
  portionG: number;
  portionLabel: string;
  allergens: Allergen[];
  /** Zat gizi per 1 porsi (portionG); null bila TKPI kosong (bukan 0) */
  perPortion: Record<MenuNutrient, number | null>;
}

export const FOOD_CATEGORY_LABELS = MENU_CATEGORY_LABELS;

/** Sel kosong = tidak dianalisis di TKPI → null, tidak pernah 0. */
function num(s: string | undefined): number | null {
  if (s == null || s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isPlausible(energy: number | null, protein: number | null, carbs: number | null, fat: number | null): boolean {
  if (energy == null || protein == null || carbs == null || fat == null) return false;
  if (energy === 0) return protein + carbs + fat === 0;
  const ratio = (4 * protein + 4 * carbs + 9 * fat) / energy;
  return ratio >= ATWATER_SANITY.min && ratio <= ATWATER_SANITY.max;
}

async function loadCsv(file: string): Promise<Record<string, string>[]> {
  const res = await fetch(`/datasets/${file}.csv`);
  if (!res.ok) throw new Error(`Gagal memuat ${file}.csv: ${res.status}`);
  const text = (await res.text()).replace(/^﻿/, '');
  return Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data;
}

function toMenuFood(row: Record<string, string>, file: string): MenuFood | null {
  const code = row.kode_tkpi?.trim();
  const category = row.kategori?.trim() as MenuCategory;
  const portionG = num(row.berat_porsi_g);
  const label = `${file}.csv ${code} ${row.nama_menu}`;
  if (row.aktif?.trim() === '0') return null;
  if (!code || !CATEGORIES.includes(category) || portionG == null || portionG <= 0) {
    console.warn(`[menu] ${label} dilewati: kode/kategori/berat porsi tidak valid`);
    return null;
  }
  const per100 = Object.fromEntries(
    MENU_NUTRIENTS.map((n) => [n, num(row[NUTRIENT_COLUMNS[n]])]),
  ) as Record<MenuNutrient, number | null>;
  if (per100.iron == null || per100.calcium == null || !isPlausible(per100.energy, per100.protein, per100.carbs, per100.fat)) {
    console.warn(`[menu] ${label} dilewati: data TKPI tidak lengkap/janggal`);
    return null;
  }
  const f = portionG / 100;
  return {
    key: `tkpi:${code}`,
    code,
    name: row.nama_menu.trim(),
    tkpiName: row.nama_tkpi?.trim() ?? '',
    category,
    portionG,
    portionLabel: row.porsi_urt?.trim() || `${portionG} g`,
    allergens: (row.alergen ?? '')
      .split(';')
      .map((a) => a.trim() as Allergen)
      .filter((a) => ALLERGENS.includes(a)),
    perPortion: Object.fromEntries(
      MENU_NUTRIENTS.map((n) => [n, per100[n] == null ? null : (per100[n] as number) * f]),
    ) as Record<MenuNutrient, number | null>,
  };
}

let menuCache: Promise<MenuFood[]> | null = null;

/** Makanan menu dari lima CSV TKPI, di-cache setelah unduhan pertama. */
export function loadMenuFoods(): Promise<MenuFood[]> {
  if (!menuCache) {
    menuCache = Promise.all(
      MENU_CSV_FILES.map(async (file) =>
        (await loadCsv(file)).map((row) => toMenuFood(row, file)).filter((f): f is MenuFood => f !== null),
      ),
    )
      .then((lists) => lists.flat())
      .catch((err) => {
        menuCache = null; // izinkan coba lagi
        throw err;
      });
  }
  return menuCache;
}

/**
 * Kunci makanan dari dataset CSV lama (`sh:Ayam Goreng`) → kunci TKPI (`tkpi:FP024`).
 * Kunci yang tidak dikenali dibiarkan apa adanya (tetap tampil di profil, tidak dibuang diam-diam).
 */
export function migrateFoodKeys(keys: string[]): string[] {
  const out: string[] = [];
  for (const k of keys) {
    const mapped = LEGACY_FOOD_KEY_MAP[k];
    for (const nk of mapped ? mapped.map((c) => `tkpi:${c}`) : [k]) {
      if (!out.includes(nk)) out.push(nk);
    }
  }
  return out;
}

/** Label untuk kunci yang tidak (lagi) ada di daftar menu, mis. `sh:Belut Goreng` → `Belut Goreng`. */
export function fallbackFoodLabel(key: string): string {
  const i = key.indexOf(':');
  return i >= 0 ? key.slice(i + 1) : key;
}
