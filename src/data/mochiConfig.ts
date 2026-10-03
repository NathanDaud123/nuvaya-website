/**
 * MOCHI Calculation & Personalization Specification v1.0
 * Config terpusat & versioned — JANGAN hard-code angka di service/UI.
 *
 * Referensi:
 * - Energi: DRI 2023 pregnancy-specific EER
 * - Target zat gizi: AKG Indonesia 2019 (Permenkes No. 28/2019)
 * - GWG: IOM 2009
 * - Komposisi pangan: TKPI 2017
 *
 * Harris-Benedict & Mifflin-St Jeor TIDAK digunakan sebagai algoritme utama.
 */

export const MOCHI_VERSIONS = {
  algorithm: 'MOCHI-CALC-v1.0',
  energyReference: 'DRI_2023_EER_PREGNANCY',
  nutrientReference: 'AKG_INDONESIA_2019',
  gwgReference: 'IOM_2009',
  foodCompositionReference: 'TKPI_2017',
} as const;

/** Batas trimester — configurable */
export const TRIMESTER_BOUNDARIES = {
  t1MaxWeeks: 13,
  t2MaxWeeks: 27,
} as const;

/** Kategori IMT pra-hamil (dari BB pra-hamil, BUKAN BB saat ini) */
export const BMI_CATEGORIES = [
  { id: 'underweight', label: 'Underweight', min: 0, max: 18.5 },
  { id: 'normal', label: 'Normal', min: 18.5, max: 25.0 },
  { id: 'overweight', label: 'Overweight', min: 25.0, max: 30.0 },
  { id: 'obesity', label: 'Obesity', min: 30.0, max: Infinity },
] as const;

export type BmiCategoryId = 'underweight' | 'normal' | 'overweight' | 'obesity';

/** Target GWG IOM 2009 per kategori IMT pra-hamil */
export const GWG_TARGETS: Record<
  BmiCategoryId,
  { totalMinKg: number; totalMaxKg: number; rateT2T3MinKgPerWeek: number; rateT2T3MaxKgPerWeek: number }
> = {
  underweight: { totalMinKg: 12.5, totalMaxKg: 18, rateT2T3MinKgPerWeek: 0.44, rateT2T3MaxKgPerWeek: 0.58 },
  normal: { totalMinKg: 11.5, totalMaxKg: 16, rateT2T3MinKgPerWeek: 0.35, rateT2T3MaxKgPerWeek: 0.5 },
  overweight: { totalMinKg: 7, totalMaxKg: 11.5, rateT2T3MinKgPerWeek: 0.23, rateT2T3MaxKgPerWeek: 0.33 },
  obesity: { totalMinKg: 5, totalMaxKg: 9, rateT2T3MinKgPerWeek: 0.17, rateT2T3MaxKgPerWeek: 0.27 },
};

export type PhysicalActivityCategory = 'inactive' | 'low_active' | 'active' | 'very_active';

/**
 * Koefisien EER DRI 2023.
 * T1: EER = intercept - 7.01*A + hCoef*H + wCoef*W   (W = BB pra-hamil)
 * T2-T3: EER = intercept - 2.04*A + hCoef*H + wCoef*W + 9.16*G + ED
 *   (W = BB saat ini, G = minggu gestasi)
 * A = usia (th), H = tinggi (cm), W = berat (kg), G = gestasi (minggu)
 */
export const EER_TRIMESTER1: Record<
  PhysicalActivityCategory,
  { intercept: number; ageCoef: number; heightCoef: number; weightCoef: number }
> = {
  inactive: { intercept: 584.9, ageCoef: 7.01, heightCoef: 5.72, weightCoef: 11.71 },
  low_active: { intercept: 575.77, ageCoef: 7.01, heightCoef: 6.6, weightCoef: 12.14 },
  active: { intercept: 710.25, ageCoef: 7.01, heightCoef: 6.54, weightCoef: 12.34 },
  very_active: { intercept: 511.83, ageCoef: 7.01, heightCoef: 9.07, weightCoef: 12.56 },
};

export const EER_TRIMESTER23: Record<
  PhysicalActivityCategory,
  { intercept: number; ageCoef: number; heightCoef: number; weightCoef: number; gestCoef: number }
> = {
  inactive: { intercept: 1131.2, ageCoef: 2.04, heightCoef: 0.34, weightCoef: 12.15, gestCoef: 9.16 },
  low_active: { intercept: 693.35, ageCoef: 2.04, heightCoef: 5.73, weightCoef: 10.2, gestCoef: 9.16 },
  active: { intercept: -223.84, ageCoef: 2.04, heightCoef: 13.23, weightCoef: 8.15, gestCoef: 9.16 },
  very_active: { intercept: -779.72, ageCoef: 2.04, heightCoef: 18.45, weightCoef: 8.73, gestCoef: 9.16 },
};

/**
 * ED = komponen matematis EER (bukan instruksi makan).
 * Nilai -50 pada obesity bukan perintah mengurangi 50 kkal.
 */
export const ENERGY_DEPOSITION_ED: Record<BmiCategoryId, number> = {
  underweight: 300,
  normal: 200,
  overweight: 150,
  obesity: -50,
};

/** Kelompok usia AKG untuk ibu */
export type AkgAgeGroup = '13-15' | '16-18' | '19-29' | '30-49';

export interface AkgBase {
  energyKcal: number;
  proteinG: number;
  fatG: number;
  omega3G: number;
  omega6G: number;
  carbsG: number;
  fiberG: number;
  waterMl: number;
  vitA_RE: number;
  vitC_mg: number;
  folate_mcg: number;
  vitB12_mcg: number;
  calcium_mg: number;
  iron_mg: number;
  iodine_mcg: number;
  zinc_mg: number;
}

/** AKG dasar perempuan non-hamil (Permenkes 28/2019, Tabel 1-3) */
export const AKG_BASE_FEMALE: Record<AkgAgeGroup, AkgBase> = {
  '13-15': {
    energyKcal: 2050, proteinG: 65, fatG: 70, omega3G: 1.1, omega6G: 11,
    carbsG: 300, fiberG: 29, waterMl: 2100,
    vitA_RE: 600, vitC_mg: 65, folate_mcg: 400, vitB12_mcg: 4.0,
    calcium_mg: 1200, iron_mg: 15, iodine_mcg: 150, zinc_mg: 9,
  },
  '16-18': {
    energyKcal: 2100, proteinG: 65, fatG: 70, omega3G: 1.1, omega6G: 11,
    carbsG: 300, fiberG: 29, waterMl: 2150,
    vitA_RE: 600, vitC_mg: 75, folate_mcg: 400, vitB12_mcg: 4.0,
    calcium_mg: 1200, iron_mg: 15, iodine_mcg: 150, zinc_mg: 9,
  },
  '19-29': {
    energyKcal: 2250, proteinG: 60, fatG: 65, omega3G: 1.1, omega6G: 12,
    carbsG: 360, fiberG: 32, waterMl: 2350,
    vitA_RE: 600, vitC_mg: 75, folate_mcg: 400, vitB12_mcg: 4.0,
    calcium_mg: 1000, iron_mg: 18, iodine_mcg: 150, zinc_mg: 8,
  },
  '30-49': {
    energyKcal: 2150, proteinG: 60, fatG: 60, omega3G: 1.1, omega6G: 12,
    carbsG: 340, fiberG: 30, waterMl: 2350,
    vitA_RE: 600, vitC_mg: 75, folate_mcg: 400, vitB12_mcg: 4.0,
    calcium_mg: 1000, iron_mg: 18, iodine_mcg: 150, zinc_mg: 8,
  },
};

export type Trimester = 1 | 2 | 3;

/** Tambahan kehamilan per trimester (AKG 2019) */
export const PREGNANCY_INCREMENT: Record<Trimester, Partial<AkgBase>> = {
  1: {
    energyKcal: 180, proteinG: 1, fatG: 2.3, omega3G: 0.3, omega6G: 2,
    carbsG: 25, fiberG: 3, waterMl: 300,
    vitA_RE: 300, vitC_mg: 10, folate_mcg: 200, vitB12_mcg: 0.5,
    calcium_mg: 200, iron_mg: 0, iodine_mcg: 70, zinc_mg: 2,
  },
  2: {
    energyKcal: 300, proteinG: 10, fatG: 2.3, omega3G: 0.3, omega6G: 2,
    carbsG: 40, fiberG: 4, waterMl: 300,
    vitA_RE: 300, vitC_mg: 10, folate_mcg: 200, vitB12_mcg: 0.5,
    calcium_mg: 200, iron_mg: 9, iodine_mcg: 70, zinc_mg: 4,
  },
  3: {
    energyKcal: 300, proteinG: 30, fatG: 2.3, omega3G: 0.3, omega6G: 2,
    carbsG: 40, fiberG: 4, waterMl: 300,
    vitA_RE: 300, vitC_mg: 10, folate_mcg: 200, vitB12_mcg: 0.5,
    calcium_mg: 200, iron_mg: 9, iodine_mcg: 70, zinc_mg: 4,
  },
};
