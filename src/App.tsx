import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ChefHat,
  Utensils,
  BookOpen,
  ShoppingBag,
  ListRestart,
  Heart,
  Zap,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Globe,
  Leaf,
  Home,
  History as HistoryIcon,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Ingredient, MealPlan, ShoppingItem, Recipe } from "./types";
import IngredientSelector from "./components/IngredientSelector";
import MealPlanCard from "./components/MealPlanCard";
import ShoppingList from "./components/ShoppingList";
import HistoryList from "./components/HistoryList";
import { RecipeChat } from "./components/RecipeChat";
import { HomeDashboard } from "./components/HomeDashboard";

const DIETARY_TAGS = [
  { id: "quick", label: "時短 (15分以内)", icon: Zap, bg: "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200" },
  { id: "healthy", label: "ヘルシー (低カロリー)", icon: Heart, bg: "hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200" },
  { id: "kids", label: "子供が喜ぶ味付け", icon: Sparkles, bg: "hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200" },
  { id: "lowcost", label: "節約・冷蔵庫整理", icon: DollarSign, bg: "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200" },
];

const COOKING_STYLES = [
  { id: "style_all", label: "指定なし" },
  { id: "style_jp", label: "和食" },
  { id: "style_west", label: "洋食" },
  { id: "style_cn", label: "中華" },
  { id: "style_it", label: "イタリアン" },
  { id: "style_kr", label: "韓国料理" },
  { id: "style_ethnic", label: "エスニック" },
];

const DIETARY_RESTRICTIONS = [
  { id: "diet_veg", label: "ベジタリアン", desc: "肉・魚不使用" },
  { id: "diet_vegan", label: "ビーガン", desc: "動物性食材一切不使用" },
  { id: "diet_gf", label: "グルテンフリー", desc: "小麦・グルテン不使用" },
  { id: "diet_lowcarb", label: "糖質制限", desc: "炭水化物・糖質を抑える" },
  { id: "diet_lowsalt", label: "減塩", desc: "塩分を抑える" },
  { id: "diet_dairyfree", label: "乳製品不使用", desc: "牛乳やバター等の不使用" },
];

const MEAL_TYPES = [
  { id: "dinner", label: "夕食", desc: "1日を締めくくるごちそう" },
  { id: "lunch", label: "昼食", desc: "手軽で美味しいメニュー" },
  { id: "breakfast", label: "朝食", desc: "健康的でエネルギーの出る朝ご飯" },
  { id: "side_snack", label: "副菜・おつまみ", desc: "もう一品欲しいときに" },
];

export default function App() {
  // Navigation Tab state: "home" | "generator" | "shopping" | "history"
  const [activeTab, setActiveTab] = useState<"home" | "generator" | "shopping" | "history">("home");

  // State for input ingredients
  const [ingredients, setIngredients] = useState<string[]>(() => {
    const saved = localStorage.getItem("ai_menu_ingredients");
    return saved ? JSON.parse(saved) : ["豚肉", "キャベツ", "玉ねぎ"];
  });

  // State for generator config
  const [mealType, setMealType] = useState("夕食");
  const [mealCount, setMealCount] = useState(2); // 1 to 3 items
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("指定なし");
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Loading state & messages
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Chat Drawer state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Loaded/Active meal plan
  const [activePlan, setActivePlan] = useState<MealPlan | null>(() => {
    const saved = localStorage.getItem("ai_menu_active_plan");
    return saved ? JSON.parse(saved) : null;
  });

  // History list of meal plans
  const [historyPlans, setHistoryPlans] = useState<MealPlan[]>(() => {
    const saved = localStorage.getItem("ai_menu_history");
    return saved ? JSON.parse(saved) : [];
  });

  // Persistent shopping list
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem("ai_menu_shopping_list");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("ai_menu_ingredients", JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem("ai_menu_active_plan", JSON.stringify(activePlan));
  }, [activePlan]);

  useEffect(() => {
    localStorage.setItem("ai_menu_history", JSON.stringify(historyPlans));
  }, [historyPlans]);

  useEffect(() => {
    localStorage.setItem("ai_menu_shopping_list", JSON.stringify(shoppingList));
  }, [shoppingList]);

  // Loading animation messages rotating
  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 3500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleAddIngredient = (name: string) => {
    if (!ingredients.includes(name)) {
      setIngredients([...ingredients, name]);
    }
  };

  const handleRemoveIngredient = (name: string) => {
    setIngredients(ingredients.filter((i) => i !== name));
  };

  const handleClearIngredients = () => {
    setIngredients([]);
  };

  const toggleTag = (label: string) => {
    setSelectedTags((prev) =>
      prev.includes(label) ? prev.filter((t) => t !== label) : [...prev, label]
    );
  };

  const toggleDietary = (label: string) => {
    setSelectedDietary((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label]
    );
  };

  // Generate Menu & Shopping List using Server-Side Gemini API
  const handleGeneratePlan = async () => {
    if (ingredients.length === 0) {
      setErrorMessage("使いたい食材を1つ以上入力してください。");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availableIngredients: ingredients,
          dietaryRestrictions: [...selectedTags, ...selectedDietary],
          cookingStyle: selectedStyle,
          mealCount,
          mealType,
          additionalNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "献立の生成中に通信エラーが発生しました。");
      }

      const data = await response.json();

      // Create a unique MealPlan ID
      const planId = "plan-" + Date.now();
      const newPlan: MealPlan = {
        id: planId,
        createdAt: new Date().toISOString(),
        title: data.title,
        recipes: data.recipes.map((r: any, idx: number) => ({
          ...r,
          id: `recipe-${planId}-${idx}`,
        })),
        shoppingList: [], // populated below
      };

      // Extract ALL ingredients into shoppingItems (check off if already in available ingredients or not missing)
      const generatedShoppingItems: ShoppingItem[] = [];
      newPlan.recipes.forEach((recipe: Recipe) => {
        recipe.ingredients.forEach((ing) => {
          // Check if duplicate shopping list item already added
          const duplicate = generatedShoppingItems.find(
            (item) => item.name.toLowerCase() === ing.name.toLowerCase()
          );
          if (!duplicate) {
            const isAtHome = ingredients.some(
              (userIng) =>
                ing.name.toLowerCase().includes(userIng.toLowerCase()) ||
                userIng.toLowerCase().includes(ing.name.toLowerCase())
            ) || !ing.isMissing;

            generatedShoppingItems.push({
              id: `shop-${planId}-${Math.random().toString(36).substr(2, 9)}`,
              name: ing.name,
              quantity: ing.quantity,
              category: ing.category,
              completed: isAtHome, // Checked (crossed off) if already at home
              recipeTitle: recipe.title,
            });
          }
        });
      });

      newPlan.shoppingList = generatedShoppingItems;

      // Update States
      setActivePlan(newPlan);
      setShoppingList(generatedShoppingItems);
      setHistoryPlans((prev) => [newPlan, ...prev]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "予期しないエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  // Shopping List interactions
  const handleToggleShoppingItem = (id: string) => {
    setShoppingList(
      shoppingList.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddCustomShoppingItem = (name: string, quantity: string, category: string) => {
    const newItem: ShoppingItem = {
      id: `custom-shop-${Date.now()}`,
      name,
      quantity,
      category,
      completed: false,
      isCustom: true,
    };
    setShoppingList([newItem, ...shoppingList]);
  };

  const handleRemoveShoppingItem = (id: string) => {
    setShoppingList(shoppingList.filter((item) => item.id !== id));
  };

  const handleClearCompletedShopping = () => {
    setShoppingList(shoppingList.filter((item) => !item.completed));
  };

  // History Interactions
  const handleSelectHistoryPlan = (plan: MealPlan) => {
    setActivePlan(plan);
    setShoppingList(plan.shoppingList);
  };

  const handleDeleteHistoryPlan = (id: string) => {
    setHistoryPlans(historyPlans.filter((p) => p.id !== id));
    if (activePlan?.id === id) {
      setActivePlan(null);
      setShoppingList([]);
    }
  };

  const loadingMessages = [
    "冷蔵庫の食材から、組み合わせの良いメニューを考案中...",
    "栄養管理士のデータをもとに、栄養バランスを計算中...",
    "料理が引き立つ美味しいレシピを組み立てています...",
    "不足している買い出し食材リストをまとめています...",
  ];

  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-800 selection:bg-emerald-100">
      {/* Header & Navigation Bar */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-45 backdrop-blur-md bg-white/95 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div
              onClick={() => setActiveTab("home")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-sm shadow-emerald-600/15 group-hover:bg-emerald-700 transition-colors">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-md sm:text-lg font-bold text-stone-800 tracking-tight flex items-center gap-2">
                  AI献立・買い物アシスタント
                </h1>
                <p className="text-[11px] text-stone-500 hidden sm:block">
                  冷蔵庫の食材からAIが美味しい献立と買い物リストを自動作成
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:hidden">
              <button
                onClick={() => setIsChatOpen(true)}
                className="p-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-2xs"
                title="AIチャット相談"
                id="btn-mobile-chat"
              >
                <Bot className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/60 overflow-x-auto max-w-full no-scrollbar">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "home"
                  ? "bg-white text-emerald-800 shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
              id="tab-nav-home"
            >
              <Home className="w-3.5 h-3.5" />
              <span>ホーム</span>
            </button>

            <button
              onClick={() => setActiveTab("generator")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "generator"
                  ? "bg-white text-emerald-800 shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
              id="tab-nav-generator"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>献立作成</span>
              {activePlan && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("shopping")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "shopping"
                  ? "bg-white text-emerald-800 shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
              id="tab-nav-shopping"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>買い物リスト</span>
              {shoppingList.filter((i) => !i.completed).length > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-mono">
                  {shoppingList.filter((i) => !i.completed).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "history"
                  ? "bg-white text-emerald-800 shadow-xs font-black"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
              }`}
              id="tab-nav-history"
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              <span>履歴 ({historyPlans.length})</span>
            </button>
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              id="btn-header-open-chat"
            >
              <Bot className="w-3.5 h-3.5 text-amber-300" />
              <span>AIチャット相談</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "home" && (
          <HomeDashboard
            activePlan={activePlan}
            shoppingList={shoppingList}
            ingredients={ingredients}
            historyCount={historyPlans.length}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenChat={() => setIsChatOpen(true)}
          />
        )}

        {activeTab === "generator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Panel (Col span 5 on desktop) */}
            <div className="lg:col-span-5 space-y-6">
              {/* 1. Ingredient Input */}
              <IngredientSelector
                ingredients={ingredients}
                onAdd={handleAddIngredient}
                onRemove={handleRemoveIngredient}
                onClear={handleClearIngredients}
              />

              {/* 2. Configure Plan Settings */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-bold text-stone-800">2. 条件とテーマを設定</h2>

                {/* Meal Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-stone-500 tracking-wide uppercase mb-2">
                    食事のタイミング
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {MEAL_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setMealType(type.label)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          mealType === type.label
                            ? "border-emerald-600 bg-emerald-50/40 text-emerald-800 ring-1 ring-emerald-500/10"
                            : "border-stone-200 hover:bg-stone-50 text-stone-600"
                        }`}
                        id={`btn-config-mealtype-${type.id}`}
                      >
                        <span className="block text-sm font-bold">{type.label}</span>
                        <span className="block text-[10px] text-stone-400 mt-0.5">{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meal Count */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-stone-500 tracking-wide uppercase">
                      品数 (ボリューム)
                    </label>
                    <span className="text-xs font-bold text-emerald-600 font-mono">
                      {mealCount}品提案
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMealCount(num)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                          mealCount === num
                            ? "bg-emerald-600 text-white border-transparent shadow-xs"
                            : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                        }`}
                        id={`btn-config-count-${num}`}
                      >
                        {num === 1 ? "主菜のみ (1品)" : num === 2 ? "主菜＋副菜 (2品)" : "フルセット (3品)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dietary presets / tags */}
                <div>
                  <label className="block text-xs font-bold text-stone-500 tracking-wide uppercase mb-2.5">
                    お好みのテーマ (複数選択可)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag.label);
                      const Icon = tag.icon;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.label)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                              : `bg-white text-stone-600 border-stone-200 ${tag.bg}`
                          }`}
                          id={`btn-tag-${tag.id}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cooking Styles */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Globe className="w-3.5 h-3.5 text-stone-400" />
                    <label className="block text-xs font-bold text-stone-500 tracking-wide uppercase">
                      料理スタイル (ジャンル)
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {COOKING_STYLES.map((style) => {
                      const isSelected = selectedStyle === style.label;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setSelectedStyle(style.label)}
                          className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer truncate ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs font-black"
                              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                          }`}
                          id={`btn-style-${style.id}`}
                          title={style.label}
                        >
                          {style.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Leaf className="w-3.5 h-3.5 text-stone-400" />
                    <label className="block text-xs font-bold text-stone-500 tracking-wide uppercase">
                      食事制限・アレルギー考慮 (複数選択可)
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DIETARY_RESTRICTIONS.map((diet) => {
                      const isSelected = selectedDietary.includes(diet.label);
                      return (
                        <button
                          key={diet.id}
                          type="button"
                          onClick={() => toggleDietary(diet.label)}
                          className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-emerald-50/50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/10"
                              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                          }`}
                          id={`btn-diet-${diet.id}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Leaf className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-600" : "text-stone-400"}`} />
                            <span className="text-xs font-bold">{diet.label}</span>
                          </div>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            {diet.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom notes */}
                <div>
                  <label className="block text-xs font-bold text-stone-500 tracking-wide uppercase mb-2">
                    その他要望 (苦手な食材、アレルギーなど)
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="例: 子供が小さいため辛い味付けは避けてください。ニンニク抜きでお願いします。"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm placeholder-stone-400 bg-stone-50/20 resize-none transition-all"
                    id="textarea-additional-notes"
                  />
                </div>

                {/* Submit Trigger Button */}
                <button
                  onClick={handleGeneratePlan}
                  disabled={loading || ingredients.length === 0}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/15"
                  id="btn-submit-generation"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>AIに献立を考えてもらう</span>
                </button>
              </div>
            </div>

            {/* Output Presentation Panel (Col span 7 on desktop) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Error Notification */}
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200/60 rounded-2xl p-4 text-rose-800 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">生成中にエラーが発生しました</p>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {loading ? (
                  /* Beautiful interactive Cooking Loading Screen */
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-stone-200/80 p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[500px]"
                  >
                    {/* Rotating cooking pot animation */}
                    <div className="relative mb-8">
                      <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center animate-pulse">
                        <ChefHat className="w-12 h-12 text-emerald-600" />
                      </div>
                      <div className="absolute top-0 left-0 w-24 h-24 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>

                    <h3 className="text-xl font-bold text-stone-800 leading-tight">
                      美味しい献立レシピを作成中...
                    </h3>

                    <div className="mt-4 max-w-sm">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={loadingStep}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="text-sm text-stone-500 min-h-[40px] leading-relaxed"
                        >
                          {loadingMessages[loadingStep]}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    <div className="mt-8 flex gap-1.5">
                      {[0, 1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            loadingStep === step ? "bg-emerald-600 w-6" : "bg-stone-200"
                          }`}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : activePlan ? (
                  /* Generated result details */
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <MealPlanCard mealPlan={activePlan} />
                    <ShoppingList
                      shoppingList={shoppingList}
                      onToggleItem={handleToggleShoppingItem}
                      onAddItem={handleAddCustomShoppingItem}
                      onRemoveItem={handleRemoveShoppingItem}
                      onClearCompleted={handleClearCompletedShopping}
                    />
                  </motion.div>
                ) : (
                  /* Splash / Empty State */
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl border border-stone-200/80 p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[500px]"
                  >
                    <div className="p-4 bg-stone-50 rounded-2xl mb-5 text-stone-400">
                      <Utensils className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-stone-800 leading-tight">
                      食材を入力して、献立を始めましょう
                    </h3>
                    <p className="text-sm text-stone-500 mt-2 max-w-md leading-relaxed">
                      左側の入力パネルから、使いたい食材や条件を設定し「AIに献立を考えてもらう」をクリックしてください。Gemini
                      AIが瞬時に美味しい献立の組み合わせと、便利な買い出しリストを提案します。
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {activeTab === "shopping" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 mb-6">
              <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <span>買い物リスト管理</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                献立から自動生成された買い出し品や、自由に追加したアイテムを管理できます。家にあるものはチェックして除外し、LINEやコピーで共有しましょう。
              </p>
            </div>

            <ShoppingList
              shoppingList={shoppingList}
              onToggleItem={handleToggleShoppingItem}
              onAddItem={handleAddCustomShoppingItem}
              onRemoveItem={handleRemoveShoppingItem}
              onClearCompleted={handleClearCompletedShopping}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 mb-6">
              <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-indigo-600" />
                <span>過去の献立履歴</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                過去に作成した献立プランをいつでも再読み込みして確認できます。
              </p>
            </div>

            <HistoryList
              plans={historyPlans}
              onSelectPlan={(plan) => {
                handleSelectHistoryPlan(plan);
                setActiveTab("generator");
              }}
              onDeletePlan={handleDeleteHistoryPlan}
              activePlanId={activePlan?.id || null}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-6 mt-16 bg-white text-center text-xs text-stone-400">
        <p>© 2026 AI献立ジェネレーター. Powered by Google AI Studio & Gemini.</p>
      </footer>

      {/* AI Recipe Assistant Chat */}
      <RecipeChat
        activeRecipe={activePlan?.recipes[0] || null}
        currentMealPlan={activePlan}
        ingredients={ingredients}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onOpen={() => setIsChatOpen(true)}
      />
    </div>
  );
}
