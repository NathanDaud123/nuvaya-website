import type {
  BmiCategoryId,
  PhysicalActivityCategory,
  Trimester,
  AkgAgeGroup,
} from '../data/mochiConfig';

export type { BmiCategoryId, PhysicalActivityCategory, Trimester, AkgAgeGroup };

/** Input minimum programmer (MOCHI v1.0, Tabel Input) */
export interface MaternalProfile {
  maternalAgeYears: number;
  heightCm: number;
  prepregnancyWeightKg: number;
  currentWeightKg: number;
  gestationalAgeWeeks: number;
  physicalActivityCategory: PhysicalActivityCategory;
}

/** Alias lama — dipertahankan agar import lama tidak rusak, tapi deprecated */
export type ActivityLevel = 'low' | 'medium' | 'high';
export type Gender = 'male' | 'female';

export interface UserProfile {
  age: number;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  stressLevel: number; // 1-5
  activityLevel: ActivityLevel;
}

export interface NutritionalNeeds {
  calories: number; // kcal
  protein: number; // gram
  carbs: number; // gram
  fat: number; // gram
  fiber: number; // gram
}

/** Target zat gizi personal = AKG dasar + tambahan trimester */
export interface NutrientTargets extends NutritionalNeeds {
  energyKcalEer: number; // target energi personal (EER DRI 2023)
  akgReferenceEnergyKcal: number; // energi AKG 2019 sbg pembanding
  omega3G: number;
  omega6G: number;
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

/** Hasil kalkulasi lengkap untuk dashboard + logging backend */
export interface MochiCalculationResult {
  algorithmVersion: string;
  energyReference: string;
  nutrientReference: string;
  gwgReference: string;
  foodCompositionReference: string;
  akgAgeGroup: AkgAgeGroup;
  trimester: Trimester;
  prepregnancyBmi: number;
  bmiCategory: BmiCategoryId;
  gwgActualKg: number;
  gwgTargetMinKg: number;
  gwgTargetMaxKg: number;
  eerKcalDay: number;
  energyDepositionEd: number;
  targets: NutrientTargets;
  /** Target ringkas untuk Genetic Algorithm (kalori/protein/karbo/lemak/serat) */
  gaTarget: NutritionalNeeds;
}

export interface FoodItem {
  no: number;
  menu: string;
  energy: number;
  carbo: number;
  protein: number;
  fat: number;
  price: number;
}

/** Kendala terstandar (Layar 2 — Makanan Saya) */
export type FoodConstraint = 'harga' | 'sulit_diperoleh' | 'pantangan' | 'lainnya';

export const FOOD_CONSTRAINT_LABELS: Record<FoodConstraint, string> = {
  harga: 'Harga',
  sulit_diperoleh: 'Sulit diperoleh',
  pantangan: 'Pantangan',
  lainnya: 'Lainnya',
};

/** Konteks pangan ibu — semua dari pilihan terstandar, bukan isian bebas */
export interface FoodContext {
  likedFoodKeys: string[];
  dislikedFoodKeys: string[];
  allergyFoodKeys: string[];
  allergyDetail: string;
  constraints: FoodConstraint[];
  tabooFoodKeys: string[];
}

/** Asupan aktual dari TKPI: nutrient_food = (gram/100) x nilai_TKPI_per_100g */
export interface ActualIntake {
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  ironMg: number;
  calciumMg: number;
  folateMcg: number;
}

export interface AdequacyResult {
  adequacyPercent: number; // (actual / target) x 100
  gapAbsolute: number; // target - actual
}
