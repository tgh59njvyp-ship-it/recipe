import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Check, Timer as TimerIcon, Volume2, Sparkles, RefreshCw, ChefHat, Play, Pause, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Recipe } from "../types";
import { scaleQuantity } from "../utils/quantityScaler";

interface CookingModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  servingsCount: number;
}

export function CookingModeModal({ isOpen, onClose, recipe, servingsCount }: CookingModeModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"steps" | "ingredients">("steps");

  useEffect(() => {
    setCurrentStepIndex(0);
    setCompletedSteps({});
    setTimerSeconds(null);
    setIsTimerRunning(false);
  }, [recipe, isOpen]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev === null || prev <= 1) {
            setIsTimerRunning(false);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      }
    } catch (e) {
      console.warn("Beep failed", e);
    }
  };

  if (!isOpen || !recipe) return null;

  const totalSteps = recipe.instructions.length;
  const currentStepText = recipe.instructions[currentStepIndex];
  const baseServings = recipe.servings || 2;

  // Detect time in current step
  const timeMatch = currentStepText.match(/(\d+)\s*分/);
  const detectedMinutes = timeMatch ? parseInt(timeMatch[1]) : null;

  const startStepTimer = (mins: number) => {
    setTimerSeconds(mins * 60);
    setIsTimerRunning(true);
  };

  const toggleStepCompleted = (idx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setTimerSeconds(null);
      setIsTimerRunning(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setTimerSeconds(null);
      setIsTimerRunning(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-stone-900/95 text-white flex flex-col backdrop-blur-md overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="p-4 sm:p-6 bg-stone-900 border-b border-stone-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">
                全画面料理モード ({servingsCount}人前)
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white truncate max-w-xs sm:max-w-md">
                {recipe.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch for ingredients check */}
            <button
              onClick={() => setActiveTab(activeTab === "steps" ? "ingredients" : "steps")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeTab === "ingredients"
                  ? "bg-emerald-500 text-stone-950 border-emerald-400"
                  : "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700"
              }`}
            >
              {activeTab === "steps" ? "材料一覧を見る" : "手順に戻る"}
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl transition-all cursor-pointer"
              title="料理モードを閉じる"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-800 h-2">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center max-w-3xl mx-auto w-full">
          {activeTab === "ingredients" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <h3 className="text-xl font-bold text-emerald-400">材料確認 ({servingsCount}人前)</h3>
                <span className="text-xs text-stone-400">タップして準備完了チェック</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recipe.ingredients.map((ing, i) => {
                  const scaledQty = scaleQuantity(ing.quantity, baseServings, servingsCount);
                  return (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-between"
                    >
                      <span className="font-bold text-stone-200">{ing.name}</span>
                      <span className="font-mono font-bold text-emerald-400 bg-stone-900 px-3 py-1 rounded-xl text-sm border border-stone-700">
                        {scaledQty}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 text-center"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-mono text-sm font-bold">
                  <span>STEP {currentStepIndex + 1} / {totalSteps}</span>
                </div>

                <div className="p-8 sm:p-12 bg-stone-800/90 border border-stone-700/80 rounded-3xl shadow-2xl space-y-6">
                  <p className="text-2xl sm:text-3xl font-bold leading-relaxed text-stone-100 tracking-wide">
                    {currentStepText}
                  </p>

                  {/* Timer widget if time detected */}
                  {detectedMinutes && (
                    <div className="pt-4 flex flex-col items-center justify-center">
                      {timerSeconds !== null ? (
                        <div className="bg-stone-900 border border-amber-500/50 p-4 rounded-2xl flex items-center gap-4">
                          <TimerIcon className="w-8 h-8 text-amber-400 animate-pulse" />
                          <span className="font-mono text-4xl font-extrabold text-amber-400">
                            {formatTimer(timerSeconds)}
                          </span>
                          <button
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                            className="p-3 bg-amber-500 text-stone-950 font-bold rounded-xl cursor-pointer"
                          >
                            {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startStepTimer(detectedMinutes)}
                          className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-2xl text-base transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                        >
                          <TimerIcon className="w-5 h-5" />
                          <span>{detectedMinutes}分タイマーをスタート</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Mark Done Toggle */}
                <button
                  onClick={() => toggleStepCompleted(currentStepIndex)}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all border cursor-pointer ${
                    completedSteps[currentStepIndex]
                      ? "bg-emerald-500 text-stone-950 border-emerald-400 shadow-md"
                      : "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700"
                  }`}
                >
                  <Check className="w-5 h-5" />
                  <span>{completedSteps[currentStepIndex] ? "この工程は完了済み" : "この工程を完了にする"}</span>
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Bottom Control Buttons */}
        <div className="p-4 sm:p-6 bg-stone-900 border-t border-stone-800 flex items-center justify-between gap-4 max-w-3xl mx-auto w-full">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="flex-1 py-4 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-200 font-bold rounded-2xl border border-stone-700 text-base transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
            <span>前へ</span>
          </button>

          <button
            onClick={handleNext}
            disabled={currentStepIndex === totalSteps - 1}
            className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-stone-950 font-extrabold rounded-2xl shadow-xl text-base transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>次へ進む</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </AnimatePresence>
  );
}
