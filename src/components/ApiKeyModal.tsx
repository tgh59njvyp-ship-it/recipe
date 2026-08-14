import React, { useState, useEffect } from "react";
import { Key, Check, Eye, EyeOff, X, ExternalLink, AlertTriangle } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [currentKey, setCurrentKey] = useState("");

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem("gemini_api_key") || "";
      setCurrentKey(stored);
      setKeyInput(stored);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyInput.trim();
    if (trimmed) {
      localStorage.setItem("gemini_api_key", trimmed);
      setCurrentKey(trimmed);
      setSavedSuccess(true);
      if (onSaved) onSaved(trimmed);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } else {
      localStorage.removeItem("gemini_api_key");
      setCurrentKey("");
      if (onSaved) onSaved("");
      onClose();
    }
  };

  const handleClear = () => {
    localStorage.removeItem("gemini_api_key");
    setKeyInput("");
    setCurrentKey("");
    if (onSaved) onSaved("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-2xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-lg">Gemini APIキーの設定</h3>
              <p className="text-xs text-stone-500">WebサイトでのAI献立生成・チャット機能用</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition-colors"
            id="btn-close-apikey-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Info */}
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-900 space-y-2 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5 text-emerald-800">
            <span>✨</span> 共有URLやWeb公開先で自由にお使いいただけます
          </p>
          <p className="text-emerald-700/90">
            Google AI StudioのAPIキーを入力すると、この端末のブラウザ（localStorage）に安全に保存され、公開サイト上でも制限なくAI献立が生成できるようになります。
          </p>
          <p className="text-[11px] text-emerald-800/80 bg-emerald-100/50 p-2 rounded-xl">
            💡 <strong>APIキーの形式:</strong> <code>AIzaSy...</code> で始まる文字列です（Google AI Studioで無料・1分で発行できます）。
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 font-bold underline hover:text-emerald-900 pt-1"
          >
            <span>Google AI Studioで無料APIキーを取得する（無料）</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Gemini API Key (AIzaSy...)
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-3.5 pr-10 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono"
                id="input-gemini-api-key"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {currentKey && (
              <div className="flex items-center justify-between mt-1.5 px-1">
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  APIキーが設定されています
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-rose-500 hover:underline font-medium"
                >
                  削除する
                </button>
              </div>
            )}
          </div>

          {savedSuccess && (
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>APIキーを保存しました！</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              id="btn-cancel-apikey"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!keyInput.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              id="btn-save-apikey"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存して適用</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
