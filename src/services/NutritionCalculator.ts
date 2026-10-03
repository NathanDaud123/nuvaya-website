import {
  AKG_BASE_FEMALE,
  BMI_CATEGORIES,
  EER_TRIMESTER1,
  EER_TRIMESTER23,
  ENERGY_DEPOSITION_ED,
  GWG_TARGETS,
  MOCHI_VERSIONS,
  PREGNANCY_INCREMENT,
  TRIMESTER_BOUNDARIES,
} from '../data/mochiConfig';
import type {
  ActualIntake,
  AdequacyResult,
  AkgAgeGroup,
  BmiCategoryId,
  MaternalProfile,
  MochiCalculationResult,
  NutrientTargets,
  NutritionalNeeds,
  Trimester,
  UserProfile,
} from '../models/types';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export class NutritionCalculator {
  /** BMI pra-hamil = BB pra-hamil / TB_m^2 (wajib BB pra-hamil, bukan BB saat ini) */
  static calculatePrepregnancyBmi(profile: MaternalProfile): number {
    const heightM = profile.heightCm / 100;
    return profile.prepregnancyWeightKg / (heightM * heightM);
  }

  static getBmiCategory(bmi: number): BmiCategoryId {
    for (const cat of BMI_CATEGORIES) {
      if (bmi >= cat.min && bmi < cat.max) return cat.id as BmiCategoryId;
    }
    return 'normal';
  }

  static getTrimester(gestationalAgeWeeks: number): Trimester {
    if (gestationalAgeWeeks <= TRIMESTER_BOUNDARIES.t1MaxWeeks) return 1;
    if (gestationalAgeWeeks <= TRIMESTER_BOUNDARIES.t2MaxWeeks) return 2;
    return 3;
  }

  static getAkgAgeGroup(ageYears: number): AkgAgeGroup {
    if (ageYears >= 13 && ageYears <= 15) return '13-15';
    if (ageYears >= 16 && ageYears <= 18) return '16-18';
    if (ageYears >= 30 && ageYears <= 49) return '30-49';
    return '19-29';
  }

  /** GWG aktual = BB saat ini - BB pra-hamil (IOM 2009: monitor trajectory, bukan diagnosis otomatis) */
  static calculateGwgActual(profile: MaternalProfile): number {
    return profile.currentWeightKg - profile.prepregnancyWeightKg;
  }

  /**
   * EER DRI 2023 pregnancy-specific.
   * T1: W = BB pra-hamil. T2-T3: W = BB saat ini, G = minggu gestasi, + ED.
   * ED adalah komponen matematis; -50 pada obesity bukan perintah memangkas makan.
   */
  static calculateEer(profile: MaternalProfile, bmiCategory: BmiCategoryId, trimester: Trimester): number {
    const A = profile.maternalAgeYears;
    const H = profile.heightCm;

    if (trimester === 1) {
      const W = profile.prepregnancyWeightKg;
      const c = EER_TRIMESTER1[profile.physicalActivityCategory];
      return c.intercept - c.ageCoef * A + c.heightCoef * H + c.weightCoef * W;
    }

    const W = profile.currentWeightKg;
    const G = profile.gestationalAgeWeeks;
    const c = EER_TRIMESTER23[profile.physicalActivityCategory];
    const ed = ENERGY_DEPOSITION_ED[bmiCategory];
    return c.intercept - c.ageCoef * A + c.heightCoef * H + c.weightCoef * W + c.gestCoef * G + ed;
  }

  /** target = AKG dasar(kelompok usia) + tambahan trimester. Energi AKG hanya pembanding. */
  static calculateNutrientTargets(
    ageGroup: AkgAgeGroup,
    trimester: Trimester,
    eerKcal: number,
  ): NutrientTargets {
    const base = AKG_BASE_FEMALE[ageGroup];
    const inc = PREGNANCY_INCREMENT[trimester];
    const add = (b: number, i: number | undefined): number => round1(b + (i ?? 0));

    return {
      energyKcalEer: Math.round(eerKcal),
      akgReferenceEnergyKcal: Math.round(base.energyKcal + (inc.energyKcal ?? 0)),
      calories: Math.round(eerKcal),
      protein: add(base.proteinG, inc.proteinG),
      carbs: add(base.carbsG, inc.carbsG),
      fat: add(base.fatG, inc.fatG),
      fiber: add(base.fiberG, inc.fiberG),
      omega3G: add(base.omega3G, inc.omega3G),
      omega6G: add(base.omega6G, inc.omega6G),
      waterMl: add(base.waterMl, inc.waterMl),
      vitA_RE: add(base.vitA_RE, inc.vitA_RE),
      vitC_mg: add(base.vitC_mg, inc.vitC_mg),
      folate_mcg: add(base.folate_mcg, inc.folate_mcg),
      vitB12_mcg: add(base.vitB12_mcg, inc.vitB12_mcg),
      calcium_mg: add(base.calcium_mg, inc.calcium_mg),
      iron_mg: add(base.iron_mg, inc.iron_mg),
      iodine_mcg: add(base.iodine_mcg, inc.iodine_mcg),
      zinc_mg: add(base.zinc_mg, inc.zinc_mg),
    };
  }

  /** Entry point utama MOCHI v1.0 */
  static calculateMochi(profile: MaternalProfile): MochiCalculationResult {
    const bmi = this.calculatePrepregnancyBmi(profile);
    const bmiCategory = this.getBmiCategory(bmi);
    const trimester = this.getTrimester(profile.gestationalAgeWeeks);
    const ageGroup = this.getAkgAgeGroup(profile.maternalAgeYears);
    const gwgActual = this.calculateGwgActual(profile);
    const gwgTarget = GWG_TARGETS[bmiCategory];
    const eer = this.calculateEer(profile, bmiCategory, trimester);
    const targets = this.calculateNutrientTargets(ageGroup, trimester, eer);

    return {
      algorithmVersion: MOCHI_VERSIONS.algorithm,
      energyReference: MOCHI_VERSIONS.energyReference,
      nutrientReference: MOCHI_VERSIONS.nutrientReference,
      gwgReference: MOCHI_VERSIONS.gwgReference,
      foodCompositionReference: MOCHI_VERSIONS.foodCompositionReference,
      akgAgeGroup: ageGroup,
      trimester,
      prepregnancyBmi: round1(bmi),
      bmiCategory,
      gwgActualKg: round1(gwgActual),
      gwgTargetMinKg: gwgTarget.totalMinKg,
      gwgTargetMaxKg: gwgTarget.totalMaxKg,
      eerKcalDay: Math.round(eer),
      energyDepositionEd: ENERGY_DEPOSITION_ED[bmiCategory],
      targets,
      gaTarget: {
        calories: targets.calories,
        protein: Math.round(targets.protein),
        carbs: Math.round(targets.carbs),
        fat: Math.round(targets.fat),
        fiber: Math.round(targets.fiber),
      },
    };
  }

  /**
   * Asupan aktual dari TKPI:
   * nutrient_food = (gram_consumed / 100) x nutrient_TKPI_per_100g_BDD
   * Nilai kosong TKPI TIDAK boleh dianggap 0 — teruskan sebagai missing (di sini:
   * item tanpa data gizi dilewati caller; fungsi ini hanya menjumlahkan yang ada).
   */
  static sumIntake(
    items: Array<{ grams: number; per100g: Partial<Record<keyof ActualIntake, number>> }>,
  ): ActualIntake {
    const total: ActualIntake = {
      energyKcal: 0, proteinG: 0, carbsG: 0, fatG: 0,
      fiberG: 0, ironMg: 0, calciumMg: 0, folateMcg: 0,
    };
    for (const it of items) {
      const f = it.grams / 100;
      if (it.per100g.energyKcal != null) total.energyKcal += f * it.per100g.energyKcal;
      if (it.per100g.proteinG != null) total.proteinG += f * it.per100g.proteinG;
      if (it.per100g.carbsG != null) total.carbsG += f * it.per100g.carbsG;
      if (it.per100g.fatG != null) total.fatG += f * it.per100g.fatG;
      if (it.per100g.fiberG != null) total.fiberG += f * it.per100g.fiberG;
      if (it.per100g.ironMg != null) total.ironMg += f * it.per100g.ironMg;
      if (it.per100g.calciumMg != null) total.calciumMg += f * it.per100g.calciumMg;
      if (it.per100g.folateMcg != null) total.folateMcg += f * it.per100g.folateMcg;
    }
    return total;
  }

  /**
   * Adequacy% = (actual / target) x 100 ; Gap = target - actual.
   * Label LOW/ADEQUATE/HIGH + cut-off ditentukan tim gizi (tidak di-hard-code di sini).
   */
  static adequacy(actual: number, target: number): AdequacyResult {
    return {
      adequacyPercent: target > 0 ? round1((actual / target) * 100) : 0,
      gapAbsolute: round1(target - actual),
    };
  }

  /**
   * @deprecated Gunakan calculateMochi(). Dipertahankan sementara agar
   * Recommendation/GA lama tetap jalan selama migrasi.
   */
  static calculate(profile: UserProfile): NutritionalNeeds {
    const mochi = this.calculateMochi({
      maternalAgeYears: profile.age,
      heightCm: profile.height,
      prepregnancyWeightKg: profile.weight,
      currentWeightKg: profile.weight,
      gestationalAgeWeeks: 24,
      physicalActivityCategory: 'low_active',
    });
    return mochi.gaTarget;
  }
}
