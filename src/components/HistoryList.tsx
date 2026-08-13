import React from "react";
import { BookOpen, Calendar, Trash2, ArrowRight } from "lucide-react";
import { MealPlan } from "../types";

interface HistoryListProps {
  plans: MealPlan[];
  onSelectPlan: (plan: MealPlan) => void;
  onDeletePlan: (id: string) => void;
  activePlanId: string | null;
}

export default function HistoryList({
  plans,
  onSelectPlan,
  onDeletePlan,
  activePlanId,
}: HistoryListProps) {
  if (plans.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm" id="history-list-container">
      <h2 className="text-lg font-bold text-stone-800 mb-4">保存された献立履歴</h2>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {plans.map((plan) => {
          const isActive = plan.id === activePlanId;
          const dateStr = new Date(plan.createdAt).toLocaleDateString("ja-JP", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={plan.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                isActive
                  ? "bg-emerald-50/50 border-emerald-200 ring-1 ring-emerald-500/10"
                  : "bg-stone-50/30 border-stone-100 hover:bg-stone-50"
              }`}
              id={`history-row-${plan.id}`}
            >
              <button
                onClick={() => onSelectPlan(plan)}
                className="flex items-start gap-3 flex-1 text-left min-w-0 cursor-pointer"
                id={`btn-load-history-${plan.id}`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-stone-700 truncate">{plan.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span className="text-[11px] font-mono text-stone-400">{dateStr}</span>
                    <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-sm">
                      {plan.recipes.length}品
                    </span>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1.5 shrink-0 ml-3">
                <button
                  onClick={() => onSelectPlan(plan)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "text-emerald-600 bg-emerald-100/50"
                      : "text-stone-400 hover:text-emerald-600 hover:bg-stone-100"
                  }`}
                  id={`btn-view-history-${plan.id}`}
                  title="表示"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeletePlan(plan.id)}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50/50 transition-colors cursor-pointer"
                  id={`btn-delete-history-${plan.id}`}
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
