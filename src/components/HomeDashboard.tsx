import React from "react";
import {
  Sparkles,
  ChefHat,
  ShoppingBag,
  History,
  Bot,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  Utensils,
  Plus,
  Heart,
  TrendingUp,
} from "lucide-react";
import { MealPlan, ShoppingItem } from "../types";
import { motion } from "motion/react";

interface HomeDashboardProps {
  activePlan: MealPlan | null;
  shoppingList: ShoppingItem[];
  ingredients: string[];
  historyCount: number;
  onNavigate: (tab: "home" | "generator" | "shopping" | "history") => void;
  onOpenChat: () => void;
  onSelectRecipe?: (recipeId: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  activePlan,
  shoppingList,
  ingredients,
  historyCount,
  onNavigate,
  onOpenChat,
}) => {
  const pendingShoppingCount = shoppingList.filter((item) => !item.completed).length;
  const totalShoppingCount = shoppingList.length;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-600 via-teal-700 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-bold border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>AIスマートクッキングパートナーへようこそ</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            今日の献立はどうしますか？
          </h2>

          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed opacity-90">
            冷蔵庫の食材を選ぶだけで、AIが栄養バランス抜群の献立と、買い出しリストを自動作成します。調理の疑問はいつでもAIチャットにご相談ください。
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate("generator")}
              className="px-6 py-3 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              id="btn-hero-generate"
            >
              <ChefHat className="w-4 h-4 text-emerald-600" />
              <span>献立を新しく作る</span>
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </button>

            <button
              onClick={onOpenChat}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all border border-white/20 backdrop-blur-md flex items-center gap-2 cursor-pointer"
              id="btn-hero-chat"
            >
              <Bot className="w-4 h-4 text-amber-300" />
              <span>AI料理相談する</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate("generator")}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Utensils className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
              冷蔵庫
            </span>
          </div>
          <p className="text-2xl font-black text-stone-800 font-mono">{ingredients.length} <span className="text-xs font-normal text-stone-500">品</span></p>
          <p className="text-xs font-bold text-stone-500 mt-1">手持ちの食材</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate("shopping")}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
              買い出し
            </span>
          </div>
          <p className="text-2xl font-black text-stone-800 font-mono">
            {pendingShoppingCount} <span className="text-xs font-normal text-stone-500">/ {totalShoppingCount}</span>
          </p>
          <p className="text-xs font-bold text-stone-500 mt-1">未購入の買い出し品</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate("history")}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <History className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
              アーカイブ
            </span>
          </div>
          <p className="text-2xl font-black text-stone-800 font-mono">{historyCount} <span className="text-xs font-normal text-stone-500">件</span></p>
          <p className="text-xs font-bold text-stone-500 mt-1">保存された献立履歴</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          onClick={onOpenChat}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full animate-pulse">
              AI常時対応
            </span>
          </div>
          <p className="text-sm font-black text-stone-800 mt-1">なんでも質問</p>
          <p className="text-[11px] text-stone-400 mt-0.5">代用やコツを即解決</p>
        </motion.div>
      </div>

      {/* Current Active Plan Preview Section */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-base font-bold text-stone-800">現在の献立プラン</h3>
          </div>
          <button
            onClick={() => onNavigate("generator")}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <span>献立管理・新規作成</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activePlan ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-stone-50 p-4 rounded-xl border border-stone-100 gap-2">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  アクティブプラン
                </span>
                <h4 className="text-base font-bold text-stone-800 mt-1">{activePlan.title}</h4>
                <p className="text-xs text-stone-400 mt-0.5">作成日時: {activePlan.createdAt}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-600 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                  {activePlan.recipes.length}品構成
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activePlan.recipes.map((recipe, idx) => (
                <div
                  key={recipe.id || idx}
                  onClick={() => onNavigate("generator")}
                  className="bg-stone-50/50 hover:bg-emerald-50/30 border border-stone-200/60 hover:border-emerald-300 p-4 rounded-xl transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400">
                      <span>メニュー {idx + 1}</span>
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="w-3 h-3" />
                        {recipe.prepTime + recipe.cookTime}分
                      </span>
                    </div>
                    <h5 className="font-bold text-stone-800 group-hover:text-emerald-800 transition-colors text-sm line-clamp-1">
                      {recipe.title}
                    </h5>
                    <p className="text-xs text-stone-500 line-clamp-2">{recipe.description}</p>
                  </div>

                  {recipe.nutrition && (
                    <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                      <span className="flex items-center gap-1 text-orange-600 font-bold">
                        <Flame className="w-3 h-3" />
                        {recipe.nutrition.calories || 0} kcal
                      </span>
                      <span>P: {recipe.nutrition.protein || 0}g</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-stone-50/60 rounded-2xl border border-dashed border-stone-200 p-6 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-700">現在アクティブな献立はありません</p>
              <p className="text-xs text-stone-400 mt-1">
                使いたい食材を入力して、あなただけの特別な献立を作ってみましょう！
              </p>
            </div>
            <button
              onClick={() => onNavigate("generator")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>献立を作成する</span>
            </button>
          </div>
        )}
      </div>

      {/* Features Showcase / Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h4 className="font-bold text-stone-800 text-sm">食材を選ぶ・入力</h4>
          <p className="text-xs text-stone-500 leading-relaxed">
            冷蔵庫にある余った食材をタップして追加。AIがそれらを無駄なく使い切る最高のレシピを考案します。
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h4 className="font-bold text-stone-800 text-sm">栄養素と推奨量の確認</h4>
          <p className="text-xs text-stone-500 leading-relaxed">
            各メニューのカロリー・タンパク質・脂質・炭水化物の推定値と、1日の推奨摂取量への貢献度をひと目で把握できます。
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h4 className="font-bold text-stone-800 text-sm">買い出しリストと共有</h4>
          <p className="text-xs text-stone-500 leading-relaxed">
            足りない食材や追加したアイテムを自動集約。LINEやチャット、Markdownなどにワンタップでコピーして買い物に行けます。
          </p>
        </div>
      </div>
    </div>
  );
};
