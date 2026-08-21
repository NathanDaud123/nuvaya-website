import type { UserProfile, NutritionalNeeds } from '../models/types';

export class NutritionCalculator {
  static calculate(profile: UserProfile): NutritionalNeeds {
    // BMR calculation using Mifflin-St Jeor Equation
    let bmr: number;
    if (profile.gender === 'male') {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    }

    // Activity multiplier
    let activityMultiplier = 1.2;
    if (profile.activityLevel === 'medium') activityMultiplier = 1.55;
    else if (profile.activityLevel === 'high') activityMultiplier = 1.725;

    // Stress adjustment (add 2% for each stress level)
    const stressMultiplier = 1.0 + profile.stressLevel * 0.02;

    const calories = bmr * activityMultiplier * stressMultiplier;

    // Macronutrient distribution (for healthy adults: ~30% protein, 45% carbs, 25% fat)
    const protein = (calories * 0.30) / 4; // 4 kcal per gram
    const carbs = (calories * 0.45) / 4; // 4 kcal per gram
    const fat = (calories * 0.25) / 9; // 9 kcal per gram
    const fiber = calories / 100; // Rough estimate: 1g per 100 kcal

    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      fiber: Math.round(fiber),
    };
  }
}
