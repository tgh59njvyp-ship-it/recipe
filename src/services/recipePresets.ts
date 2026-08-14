import { MealPlan, Recipe } from "../types";

export interface RecipeTemplate {
  name: string;
  cookingStyle: string;
  mealType: string;
  dietaryTags: string[];
  matchedKeywords: string[];
  recipes: Recipe[];
}

export const SMART_RECIPE_TEMPLATES: RecipeTemplate[] = [
  {
    name: "豚肉とキャベツの黄金コンビ献立",
    cookingStyle: "和食",
    mealType: "夕食",
    dietaryTags: ["quick", "balanced"],
    matchedKeywords: ["豚肉", "豚バラ", "豚こま", "豚ロース", "キャベツ", "玉ねぎ"],
    recipes: [
      {
        id: "pork-cabbage-stirfry",
        title: "豚肉とキャベツの香味味噌マヨ炒め",
        description: "キャベツの甘みと豚肉の旨味が濃厚な味噌マヨダレに絡む、ご飯が進む大満足メインおかずです。",
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        difficulty: "簡単",
        mealType: "主菜",
        ingredients: [
          { name: "豚こま肉（または豚バラ）", quantity: "200g", category: "肉・魚", isMissing: false },
          { name: "キャベツ", quantity: "1/4玉（約200g）", category: "野菜", isMissing: false },
          { name: "玉ねぎ", quantity: "1/2個", category: "野菜", isMissing: false },
          { name: "味噌", quantity: "大さじ1.5", category: "調味料", isMissing: false },
          { name: "マヨネーズ", quantity: "大さじ1", category: "調味料", isMissing: false },
          { name: "みりん・酒", quantity: "各大さじ1", category: "調味料", isMissing: false },
          { name: "おろし生姜", quantity: "小さじ1", category: "調味料", isMissing: true },
        ],
        instructions: [
          "キャベツはざく切り、玉ねぎは1cm幅のくし形切りにします。",
          "豚肉に軽く塩コショウを振り、合わせ調味料（味噌・マヨネーズ・みりん・酒・生姜）を混ぜておきます。",
          "フライパンに少量の油を熱し、豚肉を色が変わるまで中火で炒めます。",
          "玉ねぎとキャベツを加え、強火でサッと炒め合わせてシャキッと火を通します。",
          "合わせ調味料を一気に回し入れ、全体にタレが絡むまで手早く炒め合わせたら完成です！",
        ],
        nutrition: {
          calories: 380,
          protein: 22,
          carbs: 14,
          fat: 26,
        },
      },
      {
        id: "onion-egg-soup",
        title: "玉ねぎとふわふわ卵の優しいコンソメスープ",
        description: "玉ねぎの甘みをじっくり引き出し、ふんわり溶き卵で仕上げた心温まる栄養満点スープ。",
        prepTime: 5,
        cookTime: 8,
        servings: 2,
        difficulty: "簡単",
        mealType: "汁物",
        ingredients: [
          { name: "玉ねぎ", quantity: "1/2個", category: "野菜", isMissing: false },
          { name: "卵", quantity: "1個", category: "卵・乳製品", isMissing: true },
          { name: "水", quantity: "400ml", category: "その他", isMissing: false },
          { name: "顆粒コンソメ", quantity: "小さじ2", category: "調味料", isMissing: false },
          { name: "塩・粗挽き黒胡椒", quantity: "少々", category: "調味料", isMissing: false },
          { name: "乾燥パセリ", quantity: "少々", category: "調味料", isMissing: true },
        ],
        instructions: [
          "玉ねぎは薄切りにします。卵は小鉢でしっかり溶きほぐします。",
          "小鍋に水と玉ねぎを入れて中火にかけ、煮立ったらコンソメを加えます。",
          "弱火で2〜3分、玉ねぎが透き通るまで煮ます。",
          "スープを軽くかき混ぜて渦を作り、溶き卵を細く流し入れてふんわり浮き上がらせます。",
          "塩・黒胡椒で味を調え、器に盛り付けてお好みでパセリを散らします。",
        ],
        nutrition: {
          calories: 95,
          protein: 6,
          carbs: 8,
          fat: 4,
        },
      },
    ],
  },
  {
    name: "鶏肉と彩り野菜のヘルシーバランス献立",
    cookingStyle: "和食",
    mealType: "夕食",
    dietaryTags: ["healthy", "protein", "diet_lowcarb"],
    matchedKeywords: ["鶏肉", "鶏もも", "鶏むね", "鶏ささみ", "人参", "ブロッコリー", "きのこ", "ピーマン"],
    recipes: [
      {
        id: "chicken-teriyaki-steam",
        title: "鶏肉とたっぷり野菜の旨み蒸し焼き",
        description: "フライパンひとつで完成！蒸気で旨味を閉じ込めたジューシーチキンと甘み引き立つ温野菜。",
        prepTime: 8,
        cookTime: 12,
        servings: 2,
        difficulty: "簡単",
        mealType: "主菜",
        ingredients: [
          { name: "鶏肉（もも又はむね）", quantity: "250g", category: "肉・魚", isMissing: false },
          { name: "人参やブロッコリーなど手持ち野菜", quantity: "150g", category: "野菜", isMissing: false },
          { name: "酒・醤油", quantity: "各大さじ1", category: "調味料", isMissing: false },
          { name: "おろしにんにく", quantity: "小さじ1/2", category: "調味料", isMissing: true },
          { name: "ごま油", quantity: "大さじ1/2", category: "調味料", isMissing: false },
        ],
        instructions: [
          "鶏肉はひと口大に切り、酒と醤油、にんにくを揉み込んで5分置きます。",
          "野菜は食べやすいひと口サイズにカットします。",
          "フライパンにごま油を熱し、鶏肉を皮目から並べて中火でこんがり焼きます。",
          "裏返して周りに野菜を敷き詰め、酒（大さじ1分量外）を回し入れて蓋をし、弱火で5〜6分蒸し焼きにします。",
          "蓋を取り、水分を飛ばしながら全体を軽く炒めて香ばしさを出したら完成です。",
        ],
        nutrition: {
          calories: 340,
          protein: 28,
          carbs: 9,
          fat: 20,
        },
      },
      {
        id: "healthy-side-salad",
        title: "シャキシャキ野菜のごまポン和え",
        description: "箸休めにぴったり。ごまの香ばしさとポン酢の酸味でさっぱり食べられる副菜。",
        prepTime: 5,
        cookTime: 0,
        servings: 2,
        difficulty: "簡単",
        mealType: "副菜",
        ingredients: [
          { name: "手持ちの葉物野菜や千切り野菜", quantity: "100g", category: "野菜", isMissing: false },
          { name: "ポン酢", quantity: "大さじ1", category: "調味料", isMissing: false },
          { name: "すりごま", quantity: "大さじ1", category: "調味料", isMissing: true },
          { name: "ごま油", quantity: "小さじ1/2", category: "調味料", isMissing: false },
        ],
        instructions: [
          "野菜を千切りまたは食べやすい大きさに切って水気をしっかり切ります。",
          "ボウルにポン酢、すりごま、ごま油を合わせてよく混ぜます。",
          "野菜を加えてサッと和え、器に盛り付けます。",
        ],
        nutrition: {
          calories: 60,
          protein: 2,
          carbs: 4,
          fat: 4,
        },
      },
    ],
  },
];

export function buildFallbackMealPlan(ingredients: string[], mealType: string = "夕食", mealCount: number = 2): { title: string; recipes: Recipe[] } {
  // Find closest template matching user's ingredients
  const ingLower = ingredients.map((i) => i.trim().toLowerCase());
  
  let bestTemplate = SMART_RECIPE_TEMPLATES[0];
  let maxMatches = -1;

  for (const template of SMART_RECIPE_TEMPLATES) {
    const matchCount = template.matchedKeywords.filter((kw) =>
      ingLower.some((userIng) => userIng.includes(kw) || kw.includes(userIng))
    ).length;
    if (matchCount > maxMatches) {
      maxMatches = matchCount;
      bestTemplate = template;
    }
  }

  // If user entered custom ingredients, dynamically adapt the primary recipe to incorporate user's real ingredients
  const primaryIng = ingredients.slice(0, 3);
  const adaptedTitle = `${primaryIng.join("・")}を活用した${mealType}の絶品バランス献立`;

  const adaptedRecipes: Recipe[] = bestTemplate.recipes.slice(0, Math.max(1, Math.min(3, mealCount))).map((recipe, idx) => {
    if (idx === 0) {
      return {
        ...recipe,
        title: `${ingredients[0] || "豚肉"}と${ingredients[1] || "キャベツ"}の特製ごちそう炒め`,
        description: `お持ちの【${primaryIng.join("、")}】を美味しく使い切る、栄養満点メインレシピです。`,
        ingredients: [
          ...ingredients.map((ing) => ({
            name: ing,
            quantity: "適量",
            category: "野菜" as const,
            isMissing: false,
          })),
          { name: "合わせ調味料（醤油・みりん・酒）", quantity: "各大さじ1", category: "調味料" as const, isMissing: false },
          { name: "おろし生姜またはニンニク", quantity: "小さじ1", category: "調味料" as const, isMissing: true },
        ],
      };
    }
    return recipe;
  });

  return {
    title: adaptedTitle,
    recipes: adaptedRecipes,
  };
}
