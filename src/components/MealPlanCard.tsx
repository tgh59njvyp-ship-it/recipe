import React, { useState, useEffect } from "react";
import { Clock, Users, Flame, ChevronRight, Check, CheckSquare, Square, SlidersHorizontal } from "lucide-react";
import { Recipe, MealPlan } from "../types";
import { motion, AnimatePresence } from "motion/react";

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

  // Keep track of checked instructions for each recipe to make it fully interactive
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Record<number, boolean>>>({});

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

  // Filter recipes dynamically
  const filteredRecipes = mealPlan.recipes.filter((recipe) => {
    const totalTime = recipe.prepTime + recipe.cookTime;
    
    // Time condition
    let matchesTime = true;
    if (timeFilter === "15") {
      matchesTime = totalTime <= 15;
    } else if (timeFilter === "30") {
      matchesTime = totalTime <= 30;
    } else if (timeFilter === "45") {
      matchesTime = totalTime <= 45;
    }

    // Difficulty condition
    let matchesDifficulty = true;
    if (difficultyFilter !== "all") {
      matchesDifficulty = recipe.difficulty === difficultyFilter;
    }

    return matchesTime && matchesDifficulty;
  });

  // Reactively manage active selection when filters change
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

  const activeRecipe = mealPlan.recipes.find((r) => r.id === activeRecipeId);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden" id={`meal-plan-card-${mealPlan.id}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
        <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
          AI提案の献立
        </span>
        <h2 className="text-xl font-bold mt-2.5 leading-tight" id="meal-plan-title">
          {mealPlan.title}
        </h2>
        <p className="text-xs text-emerald-100 mt-1.5">
          {new Date(mealPlan.createdAt).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })} 作成
        </p>
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
              {/* Cooking Time Filter */}
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

              {/* Difficulty Filter */}
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
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          isActive ? "bg-emerald-600" : "bg-stone-300"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                            {recipe.mealType || "主菜"}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {recipe.prepTime + recipe.cookTime}分
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-stone-800 mt-1 truncate">
                          {recipe.title}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                          {recipe.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Recipe Details */}
        <div className="col-span-2 p-6">
          <AnimatePresence mode="wait">
            {activeRecipe ? (
              <motion.div
                key={activeRecipe.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
                id={`recipe-details-${activeRecipe.id}`}
              >
                {/* Title & Stats */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                      {activeRecipe.mealType || "主菜"}
                    </span>
                    <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">
                      難易度: {activeRecipe.difficulty}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-stone-800 leading-tight">
                    {activeRecipe.title}
                  </h3>
                  <p className="text-stone-600 text-sm mt-1.5 leading-relaxed">
                    {activeRecipe.description}
                  </p>
                </div>

                {/* Cook Specs */}
                <div className="grid grid-cols-3 gap-3 bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
                  <div className="flex flex-col items-center">
                    <Clock className="w-4 h-4 text-emerald-600 mb-1" />
                    <span className="text-xs text-stone-500">準備時間</span>
                    <span className="text-sm font-bold text-stone-800">{activeRecipe.prepTime}分</span>
                  </div>
                  <div className="flex flex-col items-center border-x border-stone-200">
                    <Clock className="w-4 h-4 text-emerald-600 mb-1" />
                    <span className="text-xs text-stone-500">調理時間</span>
                    <span className="text-sm font-bold text-stone-800">{activeRecipe.cookTime}分</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Users className="w-4 h-4 text-emerald-600 mb-1" />
                    <span className="text-xs text-stone-500">分量</span>
                    <span className="text-sm font-bold text-stone-800">{activeRecipe.servings}人前</span>
                  </div>
                </div>

                {/* Nutrition (If available) */}
                {activeRecipe.nutrition && (
                  <div className="bg-stone-50/50 rounded-xl p-5 border border-stone-200/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4.5 h-4.5 text-orange-500" />
                        <h4 className="text-sm font-bold text-stone-800 tracking-wide uppercase">
                          栄養成分目安と1日の推奨摂取量への貢献度 (1人あたり)
                        </h4>
                      </div>
                      <span className="text-[10px] text-stone-400 font-semibold bg-stone-100 px-2 py-0.5 rounded-full">
                        ※成人(2000kcal)基準
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left: Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-white rounded-lg p-2.5 border border-stone-100 shadow-2xs">
                          <span className="block text-[10px] text-stone-400 font-semibold">エネルギー</span>
                          <span className="text-base font-bold text-stone-800">
                            {activeRecipe.nutrition.calories || 0} <span className="text-[10px] font-normal text-stone-500">kcal</span>
                          </span>
                          <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                            1日の {Math.round(((activeRecipe.nutrition.calories || 0) / 2000) * 100)}%
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-stone-100 shadow-2xs">
                          <span className="block text-[10px] text-stone-400 font-semibold">タンパク質</span>
                          <span className="text-base font-bold text-stone-800">
                            {activeRecipe.nutrition.protein || 0} <span className="text-[10px] font-normal text-stone-500">g</span>
                          </span>
                          <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                            1日の {Math.round(((activeRecipe.nutrition.protein || 0) / 65) * 100)}%
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-stone-100 shadow-2xs">
                          <span className="block text-[10px] text-stone-400 font-semibold">脂質</span>
                          <span className="text-base font-bold text-stone-800">
                            {activeRecipe.nutrition.fat || 0} <span className="text-[10px] font-normal text-stone-500">g</span>
                          </span>
                          <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                            1日の {Math.round(((activeRecipe.nutrition.fat || 0) / 60) * 100)}%
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-stone-100 shadow-2xs">
                          <span className="block text-[10px] text-stone-400 font-semibold">炭水化物</span>
                          <span className="text-base font-bold text-stone-800">
                            {activeRecipe.nutrition.carbs || 0} <span className="text-[10px] font-normal text-stone-500">g</span>
                          </span>
                          <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                            1日の {Math.round(((activeRecipe.nutrition.carbs || 0) / 280) * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Right: Contribution Progress Bars */}
                      <div className="bg-white rounded-xl p-4 border border-stone-100 flex flex-col justify-between space-y-3">
                        <div className="text-xs font-bold text-stone-600 flex items-center justify-between border-b border-stone-100 pb-1.5">
                          <span>1日の推奨量に対する充足度</span>
                          <span className="text-[10px] text-stone-400 font-normal">目安目標 / 1日</span>
                        </div>

                        {[
                          { label: "エネルギー", current: activeRecipe.nutrition.calories || 0, target: 2000, unit: "kcal", color: "bg-amber-500" },
                          { label: "タンパク質", current: activeRecipe.nutrition.protein || 0, target: 65, unit: "g", color: "bg-rose-500" },
                          { label: "脂質", current: activeRecipe.nutrition.fat || 0, target: 60, unit: "g", color: "bg-blue-500" },
                          { label: "炭水化物", current: activeRecipe.nutrition.carbs || 0, target: 280, unit: "g", color: "bg-emerald-500" },
                        ].map((nutrient, index) => {
                          const percentage = Math.round((nutrient.current / nutrient.target) * 100);
                          const barWidth = Math.min(percentage, 100);
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between items-center text-[11px] font-semibold text-stone-600">
                                <span className="flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${nutrient.color}`} />
                                  {nutrient.label}
                                </span>
                                <span>
                                  {nutrient.current}{nutrient.unit} <span className="text-stone-400 font-normal">/ {nutrient.target}{nutrient.unit}</span> ({percentage}%)
                                </span>
                              </div>
                              <div className="relative w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${nutrient.color} rounded-full transition-all duration-500`}
                                  style={{ width: `${barWidth}%` }}
                                />
                                {/* Marker for 1/3 target (33.3% as standard single meal goal) */}
                                <div className="absolute top-0 bottom-0 w-[2px] bg-stone-400/50 left-[33.3%]" title="1食分の目安 (33.3%)" />
                              </div>
                            </div>
                          );
                        })}
                        <div className="text-[9px] text-stone-400 flex items-center gap-1.5 justify-end mt-1">
                          <span className="inline-block w-[2px] h-2.5 bg-stone-400" />
                          <span>縦のラインは1食の標準目安 (1日の約33.3%) を示します</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ingredients Layout */}
                <div>
                  <h4 className="text-sm font-bold text-stone-800 border-b border-stone-200 pb-2 mb-3">
                    材料 ({activeRecipe.servings}人前)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {activeRecipe.ingredients.map((ing, i) => (
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
                        <span className="text-stone-500 font-mono text-xs">{ing.quantity}</span>
                      </div>
                    ))}
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
                      return (
                        <div
                          key={index}
                          onClick={() => toggleStep(activeRecipe.id, index)}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? "bg-stone-50 border-stone-200/60 opacity-60"
                              : "bg-white border-stone-100 hover:border-stone-200/80 hover:shadow-2xs"
                          }`}
                          id={`step-${activeRecipe.id}-${index}`}
                        >
                          <button
                            type="button"
                            className="mt-0.5 shrink-0 focus:outline-none"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4.5 h-4.5 text-emerald-600" />
                            ) : (
                              <Square className="w-4.5 h-4.5 text-stone-300" />
                            )}
                          </button>
                          <div className="flex-1 text-sm text-stone-700 leading-relaxed">
                            <span className="font-bold font-mono mr-1.5 text-emerald-600">
                              {index + 1}.
                            </span>
                            <span className={isChecked ? "line-through text-stone-400" : ""}>
                              {step}
                            </span>
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
