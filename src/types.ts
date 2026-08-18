export interface Ingredient {
  name: string;
  category: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  category: string;
  isMissing: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: '簡単' | '普通' | 'こだわり';
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  mealType: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  completed: boolean;
  recipeTitle?: string;
  isCustom?: boolean;
}

export interface MealPlan {
  id: string;
  createdAt: string;
  title: string;
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
}

export interface SavedShoppingList {
  id: string;
  title: string;
  createdAt: string;
  items: ShoppingItem[];
}

export interface FridgeItem {
  id: string;
  name: string;
  category: string;
  quantity?: string;
  expiryDate?: string; // YYYY-MM-DD
  addedDate: string;
}

