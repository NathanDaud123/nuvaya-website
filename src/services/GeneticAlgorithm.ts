import type { FoodItem, NutritionalNeeds } from '../models/types';

export type FoodLibrary = {
  mp: FoodItem[]; // staple
  sn: FoodItem[]; // plant
  sh: FoodItem[]; // animal
  sy: FoodItem[]; // vegetable
  plk: FoodItem[]; // side
};

export type RecommendedMenu = {
  breakfast: FoodItem[];
  lunch: FoodItem[];
  dinner: FoodItem[];
};

export class GeneticAlgorithm {
  static POPULATION_SIZE = 20;
  static GENERATIONS = 30;
  static MUTATION_RATE = 0.1;

  static run(library: FoodLibrary, target: NutritionalNeeds): RecommendedMenu | null {
    // Check if library has items
    if (Object.values(library).some((arr) => arr.length === 0)) {
      console.warn("Food library incomplete.");
      return null;
    }

    let population: number[][] = [];

    // Initialize population
    for (let i = 0; i < this.POPULATION_SIZE; i++) {
      population.push(this.createRandomIndividual(library));
    }

    // Evolution
    for (let g = 0; g < this.GENERATIONS; g++) {
      let scoredPop = population.map((ind) => ({
        individual: ind,
        fitness: this.calculateFitness(ind, library, target),
      }));

      scoredPop.sort((a, b) => b.fitness - a.fitness);

      let newPop: number[][] = [];
      newPop.push(scoredPop[0].individual);
      newPop.push(scoredPop[1].individual); // Elitism

      while (newPop.length < this.POPULATION_SIZE) {
        let p1 = this.tournamentSelection(scoredPop);
        let p2 = this.tournamentSelection(scoredPop);
        let child = this.crossover(p1, p2);
        this.mutate(child, library);
        newPop.push(child);
      }

      population = newPop;
    }

    let bestInd = population[0];
    let bestFitness = this.calculateFitness(bestInd, library, target);

    for (let i = 1; i < population.length; i++) {
      let fit = this.calculateFitness(population[i], library, target);
      if (fit > bestFitness) {
        bestFitness = fit;
        bestInd = population[i];
      }
    }

    return this.decodeIndividual(bestInd, library);
  }

  private static createRandomIndividual(lib: FoodLibrary): number[] {
    let genes: number[] = [];
    const types: (keyof FoodLibrary)[] = ['mp', 'sn', 'sh', 'sy', 'plk'];

    for (let meal = 0; meal < 3; meal++) {
      for (const type of types) {
        let max = lib[type].length;
        genes.push(Math.floor(Math.random() * max));
      }
    }
    return genes;
  }

  static calculateFitness(genes: number[], lib: FoodLibrary, target: NutritionalNeeds): number {
    let total = this.calculateTotalNutrients(genes, lib);

    let diffCal = Math.abs(total.calories - target.calories);
    let diffPro = Math.abs(total.protein - target.protein);
    let diffCarb = Math.abs(total.carbs - target.carbs);
    let diffFat = Math.abs(total.fat - target.fat);

    let penalty = diffCal + diffPro * 4 + diffCarb * 4 + diffFat * 9;
    if (penalty === 0) return 10000;
    return 10000 / penalty;
  }

  static calculateTotalNutrients(genes: number[], lib: FoodLibrary): NutritionalNeeds {
    let cal = 0,
      pro = 0,
      carb = 0,
      fat = 0;
    const types: (keyof FoodLibrary)[] = ['mp', 'sn', 'sh', 'sy', 'plk'];

    let geneIdx = 0;
    for (let meal = 0; meal < 3; meal++) {
      for (const type of types) {
        let itemIdx = genes[geneIdx];
        if (lib[type].length > 0 && itemIdx < lib[type].length) {
          let item = lib[type][itemIdx];
          cal += item.energy;
          pro += item.protein;
          carb += item.carbo;
          fat += item.fat;
        }
        geneIdx++;
      }
    }

    return { calories: cal, protein: pro, carbs: carb, fat: fat, fiber: 0 };
  }

  private static tournamentSelection(pop: { individual: number[]; fitness: number }[]): number[] {
    let bestIdx = Math.floor(Math.random() * pop.length);
    for (let i = 0; i < 2; i++) {
      let idx = Math.floor(Math.random() * pop.length);
      if (pop[idx].fitness > pop[bestIdx].fitness) {
        bestIdx = idx;
      }
    }
    return [...pop[bestIdx].individual];
  }

  private static crossover(p1: number[], p2: number[]): number[] {
    if (Math.random() > 0.7) return [...p1];

    let point = Math.floor(Math.random() * p1.length);
    let child = [...p1.slice(0, point), ...p2.slice(point)];
    return child;
  }

  private static mutate(ind: number[], lib: FoodLibrary): void {
    if (Math.random() < this.MUTATION_RATE) {
      const types: (keyof FoodLibrary)[] = ['mp', 'sn', 'sh', 'sy', 'plk'];
      let pos = Math.floor(Math.random() * ind.length);
      let typeIdx = pos % 5;
      let type = types[typeIdx];

      if (lib[type].length > 0) {
        ind[pos] = Math.floor(Math.random() * lib[type].length);
      }
    }
  }

  private static decodeIndividual(genes: number[], lib: FoodLibrary): RecommendedMenu {
    const types: (keyof FoodLibrary)[] = ['mp', 'sn', 'sh', 'sy', 'plk'];
    let meals: RecommendedMenu = { breakfast: [], lunch: [], dinner: [] };

    let idx = 0;
    const add = (time: keyof RecommendedMenu) => {
      for (const type of types) {
        let itemIdx = genes[idx++];
        if (lib[type].length > 0 && itemIdx < lib[type].length) {
          meals[time].push(lib[type][itemIdx]);
        }
      }
    };

    add('breakfast');
    add('lunch');
    add('dinner');

    return meals;
  }
}
