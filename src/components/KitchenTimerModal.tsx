import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, X, Timer as TimerIcon, Volume2, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface KitchenTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSeconds?: number;
  timerLabel?: string;
}

export function KitchenTimerModal({
  isOpen,
  onClose,
  initialSeconds = 300,
  timerLabel = "調理タイマー",
}: KitchenTimerModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsRunning(false);
    setHasFinished(false);
  }, [initialSeconds, isOpen]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setHasFinished(true);
            playAlarmSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const playAlarmSound = () => {
    try {
      // Create Web Audio API beep sound for browser reliability without external MP3 dependencies
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      }
    } catch (e) {
      console.warn("Audio alarm failed", e);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (secondsLeft === 0) setSecondsLeft(initialSeconds);
    setIsRunning(true);
    setHasFinished(false);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
    setHasFinished(false);
  };

  const setCustomTime = (mins: number) => {
    setIsRunning(false);
    setSecondsLeft(mins * 60);
    setHasFinished(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-stone-100 relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TimerIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-base">{timerLabel}</h3>
              <p className="text-xs text-stone-400">ワンタップでキッチンタイマー起動</p>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-2 mb-6">
            {[1, 3, 5, 10, 15].map((m) => (
              <button
                key={m}
                onClick={() => setCustomTime(m)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  secondsLeft === m * 60
                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                    : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                }`}
              >
                {m}分
              </button>
            ))}
          </div>

          {/* Timer Display */}
          <div
            className={`py-8 rounded-2xl text-center mb-6 transition-colors border ${
              hasFinished
                ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
                : isRunning
                ? "bg-amber-50/60 border-amber-200/80 text-amber-900"
                : "bg-stone-50 border-stone-200/80 text-stone-800"
            }`}
          >
            <div className="text-5xl font-mono font-extrabold tracking-wider">
              {formatTime(secondsLeft)}
            </div>
            {hasFinished && (
              <p className="text-xs font-bold text-rose-600 mt-2 flex items-center justify-center gap-1">
                <BellRing className="w-4 h-4 animate-bounce" /> 時間になりました！
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="p-3 text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-2xl transition-all cursor-pointer"
              title="リセット"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>スタート</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 py-3.5 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Pause className="w-5 h-5 fill-current" />
                <span>一時停止</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
