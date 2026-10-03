import Papa from 'papaparse';
import type { FoodItem } from '../models/types';
import type { FoodLibrary } from './GeneticAlgorithm';

export const FOOD_CATEGORY_LABELS: Record<keyof FoodLibrary, string> = {
  mp: 'Makanan Pokok',
  sn: 'Protein Nabati',
  sh: 'Protein Hewani',
  sy: 'Sayuran',
  plk: 'Lauk Pendamping',
};

/**
 * Berat porsi standar (gram) per kategori — nilai gizi dataset dianggap per porsi ini.
 * TODO (NUTRITION REVIEW): ganti dengan tabel porsi RT + berat porsi resmi tim gizi.
 */
export const STANDARD_PORTION_GRAMS: Record<keyof FoodLibrary, number> = {
  mp: 200,
  sn: 50,
  sh: 80,
  sy: 200,
  plk: 150,
};

/** Urutan kategori dalam tiap array menu (sesuai GeneticAlgorithm.decodeIndividual) */
export const CATEGORY_ORDER: (keyof FoodLibrary)[] = ['mp', 'sn', 'sh', 'sy', 'plk'];

const CSV_FILES: Array<{ key: keyof FoodLibrary; file: string }> = [
  { key: 'mp', file: 'rec_source_staple' },
  { key: 'sn', file: 'rec_source_plant' },
  { key: 'sh', file: 'rec_source_animal' },
  { key: 'sy', file: 'rec_source_vegetable' },
  { key: 'plk', file: 'rec_source_side' },
];

let cache: FoodLibrary | null = null;

function loadCsv(filename: string): Promise<FoodItem[]> {
  return new Promise((resolve) => {
    Papa.parse(`/datasets/${filename}.csv`, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const items = results.data
          .filter((row: any) => row.menu)
          .map((row: any) => ({
            no: row.no,
            menu: row.menu,
            energy: row.energy || 0,
            carbo: row.carbo || 0,
            protein: row.protein || 0,
            fat: row.fat || 0,
            price: row.price || 0,
          }));
        resolve(items as FoodItem[]);
      },
    });
  });
}

/** Muat 5 dataset makanan (di-cache setelah panggilan pertama). */
export async function loadFoodLibrary(): Promise<FoodLibrary> {
  if (cache) return cache;
  const entries = await Promise.all(
    CSV_FILES.map(async ({ key, file }) => [key, await loadCsv(file)] as const),
  );
  cache = Object.fromEntries(entries) as FoodLibrary;
  return cache;
}

export interface FoodOption {
  /** Id standar: `<kategori>:<nama menu>` — dipakai di recall, suka, tidak suka, alergi */
  key: string;
  menu: string;
  category: keyof FoodLibrary;
}

/** Daftar pangan terstandar untuk semua dropdown (dikelompokkan per kategori). */
export function flatFoodOptions(library: FoodLibrary): FoodOption[] {
  const out: FoodOption[] = [];
  (Object.keys(library) as (keyof FoodLibrary)[]).forEach((cat) => {
    library[cat].forEach((item) => {
      out.push({ key: `${cat}:${item.menu}`, menu: item.menu, category: cat });
    });
  });
  return out;
}
