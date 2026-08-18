import React, { useState, useEffect } from "react";
import { Clock, Users, Flame, ChevronRight, Check, CheckSquare, Square, SlidersHorizontal, Share2, Timer as TimerIcon, Copy, Sparkles, ChefHat, ShoppingCart } from "lucide-react";
import { Recipe, MealPlan } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { scaleQuantity } from "../utils/quantityScaler";
import { KitchenTimerModal } from "./KitchenTimerModal";
import { CookingModeModal } from "./CookingModeModal";

interface MealPlanCardProps {
  mealPlan: MealPlan;
}

export default function MealPlanCard({ mealPlan }: MealPlanCardProps) {
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(
    mealPlan.recipes[0]?.id || null
  );

  // Filter States
  const [timeFilter, setTimeFilter] = useState<string>("all"); // "all", "15", "30", "45"
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all"); // "all", "簡単", "普通", "こだわり"

  // Servings Scaler State
  const [servingsCount, setServingsCount] = useState<number>(2);

  // Timer Modal State
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerDuration, setTimerDuration] = useState(300);
  const [timerTitle, setTimerTitle] = useState("調理タイマー");

  // Cooking Mode State
  const [isCookingModeOpen, setIsCookingModeOpen] = useState(false);

  // Copy & Shopping List Feedback States
  const [copied, setCopied] = useState(false);
  const [addedToListMessage, setAddedToListMessage] = useState<string | null>(null);

  // Keep track of checked instructions for each recipe
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Record<number, boolean>>>({});

  const activeRecipe = mealPlan.recipes.find((r) => r.id === activeRecipeId);

  useEffect(() => {
    if (activeRecipe) {
      setServingsCount(activeRecipe.servings || 2);
    }
  }, [activeRecipeId]);

  const toggleStep = (recipeId: string, index: number) => {
    setCheckedSteps((prev) => {
      const recipeSteps = prev[recipeId] || {};
      return {
        ...prev,
        [recipeId]: {
          ...recipeSteps,
          [index]: !recipeSteps[index],
        },
      };
    });
  };

  const openTimerForStep = (minutes: number, stepText: string) => {
    setTimerDuration(minutes * 60);
    setTimerTitle(`${minutes}分タイマー (${stepText.slice(0, 15)}...)`);
    setIsTimerOpen(true);
  };

  const handleAddMissingToShoppingList = () => {
    if (!activeRecipe) return;
    const baseServings = activeRecipe.servings || 2;

    const missingIngredients = activeRecipe.ingredients.filter((ing) => ing.isMissing);
    if (missingIngredients.length === 0) {
      setAddedToListMessage("不足している材料はありません！");
      setTimeout(() => setAddedToListMessage(null), 2500);
      return;
    }

    try {
      const existingRaw = localStorage.getItem("ai_recipe_shopping_list");
      const existingList = existingRaw ? JSON.parse(existingRaw) : [];

      const newItems = missingIngredients.map((ing) => ({
        id: `auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: ing.name,
        quantity: scaleQuantity(ing.quantity, baseServings, servingsCount),
        category: "要買い出し",
        checked: false,
        recipeTitle: activeRecipe.title,
      }));

      const updated = [...existingList, ...newItems];
      localStorage.setItem("ai_recipe_shopping_list", JSON.stringify(updated));

      setAddedToListMessage(`🛒 ${missingIngredients.length}件の材料を買い物リストに追加しました！`);
      setTimeout(() => setAddedToListMessage(null), 3000);
    } catch (e) {
      console.error("Failed to add to shopping list:", e);
    }
  };

  const handleShareCopy = () => {
    if (!activeRecipe) return;
    const baseServings = activeRecipe.servings || 2;
    const ingredientsText = activeRecipe.ingredients
      .map((ing) => `・${ing.name}: ${scaleQuantity(ing.quantity, baseServings, servingsCount)}`)
      .join("\n");

    const stepsText = activeRecipe.instructions
      .map((step, idx) => `${idx + 1}. ${step}`)
      .join("\n");

    const shareText = `🍳【${activeRecipe.title}】(${servingsCount}人前)

📝 【材料】
${ingredientsText}

👨‍🍳 【作り方】
${stepsText}

✨ AI献立提案アプリより作成`;

    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter recipes dynamically
  const filteredRecipes = mealPlan.recipes.filter((recipe) => {
    const totalTime = recipe.prepTime + recipe.cookTime;
    
    let matchesTime = true;
    if (timeFilter === "15") {
      matchesTime = totalTime <= 15;
    } else if (timeFilter === "30") {
      matchesTime = totalTime <= 30;
    } else if (timeFilter === "45") {
      matchesTime = totalTime <= 45;
    }

    let matchesDifficulty = true;
    if (difficultyFilter !== "all") {
      matchesDifficulty = recipe.difficulty === difficultyFilter;
    }

    return matchesTime && matchesDifficulty;
  });

  useEffect(() => {
    if (filteredRecipes.length > 0) {
      const isStillVisible = filteredRecipes.some((r) => r.id === activeRecipeId);
      if (!isStillVisible) {
        setActiveRecipeId(filteredRecipes[0].id);
      }
    } else {
      setActiveRecipeId(null);
    }
  }, [timeFilter, difficultyFilter, mealPlan.id]);

  const baseServings = activeRecipe?.servings || 2;
  const ratio = servingsCount / baseServings;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden" id={`meal-plan-card-${mealPlan.id}`}>
      <KitchenTimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        initialSeconds={timerDuration}
        timerLabel={timerTitle}
      />

      <CookingModeModal
        isOpen={isCookingModeOpen}
        onClose={() => setIsCookingModeOpen(false)}
        recipe={activeRecipe || null}
        servingsCount={servingsCount}
      />

      {/* Toast alert for shopping list transfer */}
      <AnimatePresence>
        {addedToListMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-stone-900 text-white px-4 py-3 text-xs font-bold text-center border-b border-stone-800 shadow-lg flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <span>{addedToListMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-5 text-white flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
            AI提案の献立
          </span>
          <h2 className="text-xl font-bold mt-2 leading-tight" id="meal-plan-title">
            {mealPlan.title}
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            {new Date(mealPlan.createdAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })} 作成
          </p>
        </div>

        {/* Global Kitchen Timer & Cooking Mode Quick Buttons */}
        <div className="flex items-center gap-2">
          {activeRecipe && (
            <button
              onClick={() => setIsCookingModeOpen(true)}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title="大画面料理モード"
            >
              <ChefHat className="w-4 h-4" />
              <span>料理モード</span>
            </button>
          )}
          <button
            onClick={() => {
              setTimerDuration(300);
              setTimerTitle("キッチンタイマー");
              setIsTimerOpen(true);
            }}
            className="px-3.5 py-2 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
          >
            <TimerIcon className="w-4 h-4 text-amber-300" />
            <span>キッチンタイマー</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
        {/* Left Side: Recipe Navigator */}
        <div className="border-r border-stone-100 bg-stone-50/50 p-4 flex flex-col gap-4">
          {/* Filters Control Group */}
          <div className="bg-white p-3 rounded-xl border border-stone-200/60 shadow-3xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                <span>レシピを絞り込む</span>
              </div>
              {(timeFilter !== "all" || difficultyFilter !== "all") && (
                <button
                  onClick={() => {
                    setTimeFilter("all");
                    setDifficultyFilter("all");
                  }}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  id="btn-reset-filters-header"
                >
                  クリア
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-1">調理時間（目安）</label>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: "all", label: "すべて" },
                    { id: "15", label: "15分以内" },
                    { id: "30", label: "30分以内" },
                    { id: "45", label: "45分以内" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTimeFilter(t.id)}
                      className={`py-1 px-1.5 rounded-md text-[10px] font-semibold transition-all border text-center cursor-pointer ${
                        timeFilter === t.id
                          ? "bg-emerald-600 border-emerald-600 text-white font-bold"
                          : "bg-stone-50/50 border-stone-200 text-stone-600 hover:bg-stone-100"
                      }`}
                      id={`btn-filter-time-${t.id}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-1">難易度</label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: "all", label: "すべて" },
                    { id: "簡単", label: "簡単" },
                    { id: "普通", label: "普通" },
                    { id: "こだわり", label: "こだわり" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDifficultyFilter(d.id)}
                      className={`py-1 px-1 rounded-md text-[10px] font-semibold transition-all border text-center truncate cursor-pointer ${
                        difficultyFilter === d.id
                          ? "bg-emerald-600 border-emerald-600 text-white font-bold"
                          : "bg-stone-50/50 border-stone-200 text-stone-600 hover:bg-stone-100"
                      }`}
                      id={`btn-filter-diff-${d.id}`}
                      title={d.label}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-200/50" />

          <div>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-2 mb-2 flex justify-between items-center">
              <span>レシピ一覧</span>
              <span className="font-mono text-[11px] text-stone-500 font-bold bg-stone-100 px-1.5 py-0.5 rounded-sm">
                {filteredRecipes.length} / {mealPlan.recipes.length} 品
              </span>
            </h3>

            {filteredRecipes.length === 0 ? (
              <div className="text-center py-8 px-4 bg-stone-100/40 rounded-xl border border-dashed border-stone-200/60 text-xs text-stone-400">
                該当するレシピはありません
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecipes.map((recipe) => {
                  const isActive = recipe.id === activeRecipeId;
                  return (
                    <button
                      key={recipe.id}
                      onClick={() => setActiveRecipeId(recipe.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                        isActive
                          ? "bg-white shadow-sm border border-stone-200/60 ring-2 ring-emerald-500/10"
                          : "hover:bg-stone-100/75 border border-transparent"
                      }`}
                      id={`btn-select-recipe-${recipe.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100/80">
                            {recipe.mealType || "主菜"}
                          </span>
                          <span className="text-[10px] text-stone-400">{recipe.difficulty}</span>
                        </div>
                        <h4 className="font-bold text-stone-800 text-sm mt-1 truncate">
                          {recipe.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            {recipe.prepTime + recipe.cookTime}分
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-stone-400" />
                            {recipe.nutrition?.calories || 0} kcal
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 mt-1 transition-transform ${
                          isActive ? "text-emerald-600 translate-x-0.5" : "text-stone-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Recipe Content */}
        <div className="md:col-span-2 p-6 bg-white overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeRecipe ? (
              <motion.div
                key={activeRecipe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Recipe Main Title Bar */}
                <div className="border-b border-stone-100 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold">
                        {activeRecipe.mealType || "主菜"}
                      </span>
                      <span className="px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-md text-xs font-medium">
                        難易度: {activeRecipe.difficulty}
                      </span>
                    </div>

                    {/* Share / Copy Line Button */}
                    <button
                      onClick={handleShareCopy}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "コピーしました！" : "LINE・メモ用にコピー"}</span>
                    </button>
                  </div>

                  <h3 className="text-2xl font-bold text-stone-800 mt-2">
                    {activeRecipe.title}
                  </h3>
                  <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                    {activeRecipe.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 mt-4 pt-3 border-t border-stone-50 text-xs text-stone-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>下準備: {activeRecipe.prepTime}分</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>調理: {activeRecipe.cookTime}分</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-600" />
                      <span>{Math.round((activeRecipe.nutrition?.calories || 0) * ratio)} kcal ({servingsCount}人分)</span>
                    </div>
                  </div>
                </div>

                {/* Servings Adjuster Bar */}
                <div className="bg-amber-50/60 border border-amber-200/70 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-700" />
                    <div>
                      <span className="text-xs font-bold text-amber-900">分量の人数変更</span>
                      <p className="text-[10px] text-amber-700">タップで材料の分量を自動計算します</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200 shadow-3xs">
                    {[1, 2, 3, 4, 6].map((num) => (
                      <button
                        key={num}
                        onClick={() => setServingsCount(num)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          servingsCount === num
                            ? "bg-amber-500 text-white shadow-xs"
                            : "text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        {num}人前
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nutrition Analysis Panel */}
                {activeRecipe.nutrition && (
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3">
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between">
                      <span>栄養バランス目安 ({servingsCount}人分合計)</span>
                      <span className="text-[10px] font-normal text-stone-500">※推奨成人1日目安比</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-white rounded-xl p-2.5 border border-stone-100 shadow-2xs">
                        <span className="block text-[10px] text-stone-400 font-semibold">エネルギー</span>
                        <span className="text-base font-bold text-stone-800">
                          {Math.round((activeRecipe.nutrition.calories || 0) * ratio)}{" "}
                          <span className="text-[10px] font-normal text-stone-500">kcal</span>
                        </span>
                      </div>
                      <div className="bg-white rounded-xl p-2.5 border border-stone-100 shadow-2xs">
                        <span className="block text-[10px] text-stone-400 font-semibold">タンパク質 (P)</span>
                        <span className="text-base font-bold text-rose-700">
                          {Math.round((activeRecipe.nutrition.protein || 0) * ratio)}{" "}
                          <span className="text-[10px] font-normal text-stone-500">g</span>
                        </span>
                      </div>
                      <div className="bg-white rounded-xl p-2.5 border border-stone-100 shadow-2xs">
                        <span className="block text-[10px] text-stone-400 font-semibold">脂質 (F)</span>
                        <span className="text-base font-bold text-blue-700">
                          {Math.round((activeRecipe.nutrition.fat || 0) * ratio)}{" "}
                          <span className="text-[10px] font-normal text-stone-500">g</span>
                        </span>
                      </div>
                      <div className="bg-white rounded-xl p-2.5 border border-stone-100 shadow-2xs">
                        <span className="block text-[10px] text-stone-400 font-semibold">炭水化物 (C)</span>
                        <span className="text-base font-bold text-emerald-700">
                          {Math.round((activeRecipe.nutrition.carbs || 0) * ratio)}{" "}
                          <span className="text-[10px] font-normal text-stone-500">g</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ingredients Layout */}
                <div>
                  <div className="flex flex-wrap items-center justify-between border-b border-stone-200 pb-2 mb-3 gap-2">
                    <h4 className="text-sm font-bold text-stone-800">
                      材料 <span className="text-emerald-700 font-bold">({servingsCount}人前)</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddMissingToShoppingList}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="不足している材料を買い物リストへ追加"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
                        <span>不足分を買い物リストへ追加</span>
                      </button>
                      {ratio !== 1 && (
                        <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                          {servingsCount}人前に自動計算済み
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {activeRecipe.ingredients.map((ing, i) => {
                      const scaledQty = scaleQuantity(ing.quantity, baseServings, servingsCount);
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm py-1.5 border-b border-stone-50"
                        >
                          <div className="flex items-center gap-2">
                            {ing.isMissing ? (
                              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-sm font-medium">
                                要買い出し
                              </span>
                            ) : (
                              <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-sm font-medium">
                                手元にあり
                              </span>
                            )}
                            <span className="text-stone-700 font-medium">{ing.name}</span>
                          </div>
                          <span className="text-stone-700 font-bold font-mono text-xs bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
                            {scaledQty}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Steps / Instructions Checklist */}
                <div>
                  <h4 className="text-sm font-bold text-stone-800 border-b border-stone-200 pb-2 mb-3 flex items-center justify-between">
                    <span>作り方手順</span>
                    <span className="text-xs text-stone-400 font-normal">チェックして進捗を確認できます</span>
                  </h4>
                  <div className="space-y-3">
                    {activeRecipe.instructions.map((step, index) => {
                      const isChecked = checkedSteps[activeRecipe.id]?.[index] || false;
                      const timeMatch = step.match(/(\d+)\s*分/);
                      const minutesInStep = timeMatch ? parseInt(timeMatch[1]) : null;

                      return (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                            isChecked
                              ? "bg-stone-50 border-stone-200/60 opacity-60"
                              : "bg-white border-stone-200/80 hover:border-stone-300 hover:shadow-2xs"
                          }`}
                          id={`step-${activeRecipe.id}-${index}`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleStep(activeRecipe.id, index)}
                            className="mt-0.5 shrink-0 focus:outline-none cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Square className="w-5 h-5 text-stone-300" />
                            )}
                          </button>
                          <div className="flex-1 text-sm text-stone-700 leading-relaxed">
                            <span className="font-bold font-mono mr-1.5 text-emerald-600">
                              {index + 1}.
                            </span>
                            <span className={isChecked ? "line-through text-stone-400" : ""}>
                              {step}
                            </span>

                            {minutesInStep && !isChecked && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openTimerForStep(minutesInStep, step);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                  <TimerIcon className="w-3.5 h-3.5" />
                                  <span>{minutesInStep}分タイマーをセット</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-stone-500 text-center space-y-4">
                <SlidersHorizontal className="w-10 h-10 text-stone-300 animate-pulse" />
                <div>
                  <p className="font-bold text-stone-700 text-base">条件に一致するレシピが見つかりません</p>
                  <p className="text-xs text-stone-400 max-w-sm mt-1.5 leading-relaxed mx-auto">
                    調理時間や難易度のフィルター条件を緩めるか、下のボタンをクリックしてフィルターをリセットしてください。
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTimeFilter("all");
                    setDifficultyFilter("all");
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
                  id="btn-empty-reset"
                >
                  フィルターをすべてリセット
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
