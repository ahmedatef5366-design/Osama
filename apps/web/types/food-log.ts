export type FoodLogEntry = {
  id: string;
  clientId: string;
  foodId?: string;
  loggedAt: string;
  mealType: string;
  weightGrams: number;
  calculatedCalories: number;
  calculatedProtein: number;
  calculatedCarbs: number;
  calculatedFat: number;
  customFoodName?: string;
};

export type DailyMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
