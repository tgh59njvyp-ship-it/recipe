import React, { useState, useEffect } from "react";
import { Plus, X, Carrot, Drumstick, Egg, Leaf, Apple, Fish, Flame, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface IngredientSelectorProps {
  ingredients: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  onClear: () => void;
}

const POPULAR_INGREDIENTS = [
  { name: "豚肉", icon: Drumstick, category: "meat", bg: "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100" },
  { name: "鶏肉", icon: Drumstick, category: "meat", bg: "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100" },
  { name: "牛肉", icon: Drumstick, category: "meat", bg: "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100" },
  { name: "鮭", icon: Fish, category: "fish", bg: "bg-cyan-50 text-cyan-700 border-cyan-100 hover:bg-cyan-100" },
  { name: "キャベツ", icon: Leaf, category: "veg", bg: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" },
  { name: "玉ねぎ", icon: Carrot, category: "veg", bg: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" },
  { name: "人参", icon: Carrot, category: "veg", bg: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" },
  { name: "じゃがいも", icon: Carrot, category: "veg", bg: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" },
  { name: "トマト", icon: Apple, category: "veg", bg: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" },
  { name: "卵", icon: Egg, category: "dairy", bg: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100" },
  { name: "豆腐", icon: Flame, category: "other", bg: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100" },
  { name: "牛乳", icon: Egg, category: "dairy", bg: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100" },
  { name: "納豆", icon: Flame, category: "other", bg: "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100" },
  { name: "もやし", icon: Leaf, category: "veg", bg: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" },
  { name: "なす", icon: Carrot, category: "veg", bg: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" },
];

export default function IngredientSelector({
  ingredients,
  onAdd,
  onRemove,
  onClear,
}: IngredientSelectorProps) {
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("お使いのブラウザは音声入力に対応していません。テキスト入力をご利用ください。");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ja-JP";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          // split by whitespace or japanese punctuation
          const words = transcript.split(/[\s,、　]+/);
          words.forEach((w: string) => {
            const clean = w.trim();
            if (clean && !ingredients.includes(clean)) {
              onAdd(clean);
            }
          });
        }
        setIsListening(false);
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn("Speech recognition exception:", e);
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      onAdd(trimmed);
      setInputValue("");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-bold text-stone-800">1. 使いたい食材を入力</h2>
          <p className="text-xs text-stone-500 mt-0.5">冷蔵庫にある余り野菜や、メインに使いたい食材を選んでください</p>
        </div>
        {ingredients.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-medium text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            id="btn-clear-ingredients"
          >
            すべてクリア
          </button>
        )}
      </div>

      {/* Input Form with Voice Button */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6" id="form-ingredient-input">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="例: 豚バラ肉、レタス、アボカド"
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm placeholder-stone-400 transition-all bg-stone-50/50"
            id="input-ingredient-name"
          />
          <button
            type="button"
            onClick={startVoiceInput}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all cursor-pointer ${
              isListening
                ? "bg-rose-500 text-white animate-pulse"
                : "text-stone-400 hover:text-emerald-600 hover:bg-stone-100"
            }`}
            title="音声で食材を入力 (喋るだけ)"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-all hover:shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
          id="btn-add-ingredient"
        >
          <Plus className="w-4 h-4" />
          <span>追加</span>
        </button>
      </form>

      {/* Ingredients List */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          選択中の食材 ({ingredients.length})
        </h3>
        {ingredients.length === 0 ? (
          <div className="py-6 border-2 border-dashed border-stone-100 rounded-xl text-center text-sm text-stone-400">
            食材が追加されていません。下のクイック追加をタップするか、直接入力してください。
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {ingredients.map((ing, idx) => (
                <motion.span
                  key={ing}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100/80 rounded-full text-sm font-medium"
                >
                  <span>{ing}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(ing)}
                    className="p-0.5 rounded-full hover:bg-emerald-100 text-emerald-600 transition-colors"
                    id={`btn-remove-ing-${idx}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Quick Add Grid */}
      <div>
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          よく使う食材（クイック追加）
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {POPULAR_INGREDIENTS.map((item, idx) => {
            const isAdded = ingredients.includes(item.name);
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                type="button"
                disabled={isAdded}
                onClick={() => onAdd(item.name)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all gap-1.5 cursor-pointer ${
                  isAdded
                    ? "bg-stone-50 border-stone-100 text-stone-300 pointer-events-none"
                    : `${item.bg} border-transparent shadow-sm hover:translate-y-[-1px]`
                }`}
                id={`btn-quick-${idx}`}
              >
                <Icon className={`w-4 h-4 ${isAdded ? "text-stone-300" : ""}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
