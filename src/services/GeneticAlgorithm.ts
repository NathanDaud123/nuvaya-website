import {
  FITNESS_WEIGHTS,
  GA_PARAMS,
  MEAL_PLAN,
  MICRO_OVER_FACTOR,
  PORTION_STEPS,
  PRIMARY_STAPLE_CODES,
  REPEAT_OK_CODES,
  type MealKey,
} from '../data/menuConfig';
import type { MenuCategory } from '../data/menuFoods';
import { MENU_NUTRIENTS, type MenuFood, type MenuNutrient } from './FoodDatabase';

export type MenuTarget = Record<MenuNutrient, number>;

/** Total harian; `missing` = berapa makanan yang nilai zat gizi itu kosong di TKPI. */
export interface MenuTotals {
  value: Record<MenuNutrient, number>;
  missing: Record<MenuNutrient, number>;
}

/** Satu tempat di jadwal makan, mis. "lauk hewani makan siang", dengan pilihan makanannya. */
export interface MenuSlot {
  mealKey: MealKey;
  mealLabel: string;
  categories: MenuCategory[];
  pool: MenuFood[];
  steps: number[];
}

export interface MenuItem {
  slotIndex: number;
  food: MenuFood;
  portions: number;
}

export interface PlannedMeal {
  key: MealKey;
  label: string;
  items: MenuItem[];
}

/** Genom: [indeks makanan, indeks kelipatan porsi] untuk setiap slot. */
export type Genome = number[];

const rand = (n: number) => Math.floor(Math.random() * n);

/**
 * Bangun slot dari MEAL_PLAN. Makanan di `excluded` (alergi/hindari/pantangan) tidak pernah
 * masuk pool. Slot yang pool-nya kosong dibiarkan kosong — tidak pernah diisi ulang dengan
 * makanan yang dikecualikan.
 */
export function buildSlots(foods: MenuFood[], excluded: Set<string>): MenuSlot[] {
  const slots: MenuSlot[] = [];
  for (const meal of MEAL_PLAN) {
    for (const s of meal.slots) {
      const pool = foods.filter((f) => s.categories.includes(f.category) && !excluded.has(f.key));
      const steps = [...new Set(s.categories.flatMap((c) => PORTION_STEPS[c]))].sort((a, b) => a - b);
      slots.push({ mealKey: meal.key, mealLabel: meal.label, categories: s.categories, pool, steps });
    }
  }
  return slots;
}

export function decode(slots: MenuSlot[], genome: Genome): PlannedMeal[] {
  const meals: PlannedMeal[] = MEAL_PLAN.map((m) => ({ key: m.key, label: m.label, items: [] }));
  slots.forEach((slot, i) => {
    if (slot.pool.length === 0) return;
    const food = slot.pool[genome[2 * i] % slot.pool.length];
    const portions = slot.steps[genome[2 * i + 1] % slot.steps.length];
    meals.find((m) => m.key === slot.mealKey)?.items.push({ slotIndex: i, food, portions });
  });
  return meals;
}

export function totalsOf(items: Array<{ food: MenuFood; portions: number }>): MenuTotals {
  const value = Object.fromEntries(MENU_NUTRIENTS.map((n) => [n, 0])) as Record<MenuNutrient, number>;
  const missing = Object.fromEntries(MENU_NUTRIENTS.map((n) => [n, 0])) as Record<MenuNutrient, number>;
  for (const { food, portions } of items) {
    for (const n of MENU_NUTRIENTS) {
      const v = food.perPortion[n];
      if (v == null) missing[n] += 1;
      else value[n] += v * portions;
    }
  }
  return { value, missing };
}

function itemsOf(slots: MenuSlot[], genome: Genome) {
  const items: Array<{ food: MenuFood; portions: number }> = [];
  slots.forEach((slot, i) => {
    if (slot.pool.length === 0) return;
    items.push({
      food: slot.pool[genome[2 * i] % slot.pool.length],
      portions: slot.steps[genome[2 * i + 1] % slot.steps.length],
    });
  });
  return items;
}

/** Penalti 0 = tepat target. Semua simpangan relatif terhadap target (lihat FITNESS_WEIGHTS). */
export function penalty(slots: MenuSlot[], genome: Genome, target: MenuTarget, liked: Set<string>): number {
  const items = itemsOf(slots, genome);
  const { value } = totalsOf(items);
  const w = FITNESS_WEIGHTS;
  const rel = (n: MenuNutrient) => (target[n] > 0 ? (value[n] - target[n]) / target[n] : 0);
  const under = (n: MenuNutrient) => Math.max(0, -rel(n));
  const overFactor = (n: MenuNutrient) => (target[n] > 0 ? Math.max(0, value[n] / target[n] - MICRO_OVER_FACTOR) : 0);

  let p = w.energy * Math.abs(rel('energy'));
  const rp = rel('protein');
  p += rp < 0 ? w.proteinUnder * -rp : w.proteinOver * rp;
  p += w.carbs * Math.abs(rel('carbs'));
  p += w.fat * Math.abs(rel('fat'));
  p += w.fiberUnder * under('fiber');
  p += w.ironUnder * under('iron');
  p += w.calciumUnder * under('calcium');
  p += w.zincUnder * under('zinc');
  p += w.vitCUnder * under('vitC');
  p += w.thiaminUnder * under('thiamin');
  p += w.microOver * (overFactor('iron') + overFactor('calcium'));

  const counts = new Map<string, number>();
  for (const { food } of items) counts.set(food.code, (counts.get(food.code) ?? 0) + 1);
  for (const [code, c] of counts) {
    if (c > 1 && !REPEAT_OK_CODES.includes(code)) p += w.repeat * (c - 1);
  }
  const altStaples = items.filter((it) => it.food.category === 'pokok' && !PRIMARY_STAPLE_CODES.includes(it.food.code));
  p += w.altStaple * Math.max(0, altStaples.length - 1);

  const likedHits = [...counts.keys()].filter((code) => liked.has(`tkpi:${code}`)).length;
  p -= w.liked * likedHits;

  return Math.max(0, p);
}

function randomGenome(slots: MenuSlot[]): Genome {
  return slots.flatMap((s) => [rand(Math.max(1, s.pool.length)), rand(s.steps.length)]);
}

function mutate(slots: MenuSlot[], g: Genome): void {
  const i = rand(slots.length);
  if (Math.random() < 0.5) g[2 * i] = rand(Math.max(1, slots[i].pool.length));
  else g[2 * i + 1] = rand(slots[i].steps.length);
}

/** Crossover per slot (gen makanan + porsinya ikut bersama). */
function crossover(a: Genome, b: Genome): Genome {
  const child = [...a];
  for (let i = 0; i < a.length; i += 2) {
    if (Math.random() < 0.5) {
      child[i] = b[i];
      child[i + 1] = b[i + 1];
    }
  }
  return child;
}

export class GeneticAlgorithm {
  static run(slots: MenuSlot[], target: MenuTarget, liked: Set<string> = new Set()): Genome {
    const P = GA_PARAMS;
    const score = (g: Genome) => penalty(slots, g, target, liked);
    let pop = Array.from({ length: P.populationSize }, () => {
      const g = randomGenome(slots);
      return { g, p: score(g) };
    });

    const pick = () => {
      let best = pop[rand(pop.length)];
      for (let k = 1; k < P.tournamentSize; k++) {
        const c = pop[rand(pop.length)];
        if (c.p < best.p) best = c;
      }
      return best.g;
    };

    for (let gen = 0; gen < P.generations; gen++) {
      pop.sort((x, y) => x.p - y.p);
      const next = pop.slice(0, P.elitism);
      while (next.length < P.populationSize) {
        const child = Math.random() < P.crossoverRate ? crossover(pick(), pick()) : [...pick()];
        if (Math.random() < P.mutationRate) mutate(slots, child);
        next.push({ g: child, p: score(child) });
      }
      pop = next;
    }
    pop.sort((x, y) => x.p - y.p);
    return pop[0].g;
  }

  /**
   * "Ganti": coba semua makanan lain (dan semua kelipatan porsi) di slot ini, urutkan
   * menurut seberapa baik menu sehari tetap mendekati target, lalu pilih acak dari 3 terbaik.
   */
  static substitute(
    slots: MenuSlot[],
    genome: Genome,
    slotIndex: number,
    target: MenuTarget,
    liked: Set<string> = new Set(),
  ): Genome {
    const slot = slots[slotIndex];
    const current = slot.pool[genome[2 * slotIndex] % slot.pool.length];
    const options: Array<{ g: Genome; p: number }> = [];
    slot.pool.forEach((food, fi) => {
      if (food.code === current?.code) return;
      let best: { g: Genome; p: number } | null = null;
      slot.steps.forEach((_, si) => {
        const g = [...genome];
        g[2 * slotIndex] = fi;
        g[2 * slotIndex + 1] = si;
        const p = penalty(slots, g, target, liked);
        if (!best || p < best.p) best = { g, p };
      });
      if (best) options.push(best);
    });
    if (options.length === 0) return genome;
    options.sort((x, y) => x.p - y.p);
    return options[rand(Math.min(3, options.length))].g;
  }
}
