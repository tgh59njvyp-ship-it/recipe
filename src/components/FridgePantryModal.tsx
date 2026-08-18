import React, { useState, useEffect } from "react";
import { Refrigerator, Plus, Trash2, AlertTriangle, Check, ArrowRight, Calendar, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FridgeItem } from "../types";

interface FridgePantryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForMealPlan: (ingredients: string[]) => void;
}

export function FridgePantryModal({ isOpen, onClose, onSelectForMealPlan }: FridgePantryModalProps) {
  const [items, setItems] = useState<FridgeItem[]>(() => {
    try {
      const saved = localStorage.getItem("ai_menu_fridge_items");
      return saved
        ? JSON.parse(saved)
        : [
            { id: "1", name: "キャベツ", category: "野菜", quantity: "1/2玉", expiryDate: getFutureDate(3), addedDate: getTodayStr() },
            { id: "2", name: "豚こま肉", category: "肉・魚", quantity: "250g", expiryDate: getFutureDate(1), addedDate: getTodayStr() },
            { id: "3", name: "豆腐", category: "その他", quantity: "1丁", expiryDate: getFutureDate(2), addedDate: getTodayStr() },
          ];
    } catch {
      return [];
    }
  });

  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemDays, setNewItemDays] = useState("3");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem("ai_menu_fridge_items", JSON.stringify(items));
  }, [items]);

  function getTodayStr() {
    return new Date().toISOString().split("T")[0];
  }

  function getFutureDate(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const days = parseInt(newItemDays) || 3;
    const newItem: FridgeItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: "食材",
      quantity: newItemQty.trim() || "適量",
      expiryDate: getFutureDate(days),
      addedDate: getTodayStr(),
    };

    setItems([newItem, ...items]);
    setNewItemName("");
    setNewItemQty("");
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    setSelectedIds(selectedIds.filter((iId) => iId !== id));
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const calculateDaysLeft = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date(getTodayStr()).getTime();
    const exp = new Date(expiryDate).getTime();
    const diff = Math.ceil((exp - today) / (1000 * 3600 * 24));
    return diff;
  };

  const handleApplyToMealPlan = () => {
    const selectedNames = items
      .filter((i) => selectedIds.includes(i.id))
      .map((i) => i.name);

    if (selectedNames.length > 0) {
      onSelectForMealPlan(selectedNames);
      onClose();
    }
  };

  const handleSelectExpiringSoon = () => {
    const expiringIds = items
      .filter((i) => {
        const days = calculateDaysLeft(i.expiryDate);
        return days !== null && days <= 2;
      })
      .map((i) => i.id);

    setSelectedIds(expiringIds);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-stone-100 max-h-[90vh] flex flex-col relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Refrigerator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-800">マイ冷蔵庫・ストック管理</h2>
                <p className="text-xs text-stone-400">賞味期限間近の食材を選んでAI献立を作成！</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Add Form */}
          <form onSubmit={handleAddItem} className="py-4 border-b border-stone-100 flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="食材名（例: 鶏もも肉、牛乳）"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 min-w-[140px] px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-stone-50"
            />
            <input
              type="text"
              placeholder="数量（例: 1パック）"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              className="w-28 px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-stone-50"
            />
            <select
              value={newItemDays}
              onChange={(e) => setNewItemDays(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-700"
            >
              <option value="1">明日まで</option>
              <option value="2">2日以内</option>
              <option value="3">3日以内</option>
              <option value="5">5日以内</option>
              <option value="7">1週間以内</option>
            </select>
            <button
              type="submit"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>追加</span>
            </button>
          </form>

          {/* Controls Bar */}
          <div className="py-3 flex items-center justify-between text-xs border-b border-stone-100">
            <button
              onClick={handleSelectExpiringSoon}
              className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>賞味期限間近（あと2日以内）を一括選択</span>
            </button>
            <span className="text-stone-400">{items.length}件のストック</span>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            {items.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                冷蔵庫ストックが空です。食材を追加してみてください。
              </div>
            ) : (
              items.map((item) => {
                const daysLeft = calculateDaysLeft(item.expiryDate);
                const isSelected = selectedIds.includes(item.id);
                const isUrgent = daysLeft !== null && daysLeft <= 1;
                const isWarning = daysLeft !== null && daysLeft > 1 && daysLeft <= 2;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-300 shadow-3xs"
                        : "bg-white border-stone-200/80 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-white transition-colors ${
                          isSelected ? "bg-blue-600" : "border border-stone-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-800 text-sm">{item.name}</span>
                          <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                            {item.quantity}
                          </span>
                        </div>
                        {item.expiryDate && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            <span className="text-[11px] text-stone-400">
                              賞味期限: {item.expiryDate}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isUrgent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> 今日〜明日まで！
                        </span>
                      )}
                      {isWarning && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          あと{daysLeft}日
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-stone-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500 font-medium">
              {selectedIds.length} 個の食材を選択中
            </span>
            <button
              onClick={handleApplyToMealPlan}
              disabled={selectedIds.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>選択した食材でAI献立作成へ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
