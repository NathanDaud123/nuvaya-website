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

export interface FoodItem {
  no: number;
  menu: string;
  energy: number;
  carbo: number;
  protein: number;
  fat: number;
  price: number;
}
