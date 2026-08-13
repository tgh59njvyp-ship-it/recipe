import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  ChevronDown,
  HelpCircle,
  Copy,
  Check,
  ChefHat,
  Lightbulb,
  Key,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Recipe, MealPlan } from "../types";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface RecipeChatProps {
  activeRecipe?: Recipe | null;
  currentMealPlan?: MealPlan | null;
  ingredients?: string[];
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onOpenApiKeyModal?: () => void;
}

const QUICK_PROMPTS = [
  { label: "💡 調味料の代用", text: "手持ちのレシピにある調味料がない場合、代わりに使える調味料を教えてください。" },
  { label: "⏱ 火加減や炒め方のコツ", text: "美味しく作るための火加減や炒め方、下処理のコツを教えてください。" },
  { label: "🧊 余った食材の保存法", text: "余った食材を長持ちさせるための保存方法（冷凍・冷蔵）を教えてください。" },
  { label: "👶 子供向けアレンジ", text: "子供でも食べやすいように味付けや具材をアレンジする方法を教えてください。" },
  { label: "🥗 低カロリー・ヘルシー化", text: "カロリーや脂質を抑えてヘルシーに仕上げる工夫を教えてください。" },
];

export const RecipeChat: React.FC<RecipeChatProps> = ({
  activeRecipe,
  currentMealPlan,
  ingredients = [],
  isOpen,
  onClose,
  onOpen,
  onOpenApiKeyModal,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "こんにちは！AIクッキングパートナーです 🍳\nレシピの疑問や「この調味料ないんだけど代用できる？」「火加減のコツは？」など、分からないことは何でも気軽に聞いてくださいね！",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [includeContext, setIncludeContext] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      // Build context if included
      let contextData = null;
      if (includeContext) {
        if (activeRecipe) {
          contextData = {
            recipeTitle: activeRecipe.title,
            ingredients: activeRecipe.ingredients,
            instructions: activeRecipe.instructions,
            availableIngredients: ingredients,
          };
        } else if (currentMealPlan) {
          contextData = {
            recipeTitle: currentMealPlan.title,
            availableIngredients: ingredients,
          };
        } else if (ingredients.length > 0) {
          contextData = {
            availableIngredients: ingredients,
          };
        }
      }

      // API call to backend
      const customApiKey = localStorage.getItem("gemini_api_key") || "";
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customApiKey ? { "x-api-key": customApiKey } : {}),
        },
        body: JSON.stringify({
          message: query.trim(),
          history: messages.map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            text: m.text,
          })),
          context: contextData,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (errData?.requiresApiKey && onOpenApiKeyModal) {
          onOpenApiKeyModal();
        }
        throw new Error(errData.error || "通信エラーが発生しました");
      }

      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: `すみません、エラーが発生しました: ${error.message || "時間をおいて再度お試しください。"}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    if (window.confirm("チャットの履歴を消去しますか？")) {
      setMessages([
        {
          id: "welcome-reset",
          sender: "assistant",
          text: "チャットをリセットしました！質問があればいつでも聞いてくださいね 😊",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  // Simple formatter for bullet points, bolding (**text**), and line breaks
  const renderFormattedText = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Process bold syntax **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const lineElements = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-bold text-stone-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        return (
          <li key={idx} className="ml-4 list-disc my-0.5">
            {lineElements}
          </li>
        );
      }

      return (
        <p key={idx} className={line.trim() === "" ? "h-2" : "my-0.5"}>
          {lineElements}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpen}
          className="fixed bottom-6 right-6 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all border border-emerald-500/20 group cursor-pointer"
          id="btn-open-recipe-chat"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 border-2 border-emerald-600 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 border-2 border-emerald-600 rounded-full" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-xs font-black uppercase tracking-wider text-emerald-100">
              AI 料理アシスタント
            </span>
            <span className="text-sm font-bold text-white">質問・疑問を聞く</span>
          </div>
        </motion.button>
      )}

      {/* Chat Drawer Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-stone-200/80 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
                  <ChefHat className="w-5 h-5 text-emerald-100" />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    AI 料理アシスタント
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  </h3>
                  <p className="text-[11px] text-emerald-100/90 font-medium">
                    レシピのコツや代用・疑問を解決
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {onOpenApiKeyModal && (
                  <button
                    onClick={onOpenApiKeyModal}
                    className="p-2 hover:bg-white/10 text-emerald-100 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Gemini APIキー設定"
                    id="btn-chat-apikey"
                  >
                    <Key className="w-4 h-4 text-amber-300" />
                  </button>
                )}
                <button
                  onClick={handleClear}
                  className="p-2 hover:bg-white/10 text-emerald-100 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="チャット履歴を消去"
                  id="btn-clear-chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 text-emerald-100 hover:text-white rounded-lg transition-colors cursor-pointer"
                  id="btn-close-chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Context Badge Banner */}
            {(activeRecipe || currentMealPlan) && (
              <div className="bg-stone-50 border-b border-stone-200/60 px-4 py-2 flex items-center justify-between text-xs text-stone-600 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <span className="font-bold text-stone-700 truncate">
                    参照中: {activeRecipe ? activeRecipe.title : currentMealPlan?.title}
                  </span>
                </div>
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-500 shrink-0 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeContext}
                    onChange={(e) => setIncludeContext(e.target.checked)}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>コンテキスト共有</span>
                </label>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.sender === "user"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-[80%] space-y-1`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-emerald-600 text-white rounded-tr-xs shadow-2xs font-medium"
                          : "bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs shadow-2xs"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-2 text-[10px] text-stone-400 px-1 ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {msg.sender === "assistant" && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-stone-600 transition-colors cursor-pointer flex items-center gap-0.5"
                          title="テキストをコピー"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3 items-center text-stone-500 text-xs">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-xs border border-stone-200/80 shadow-2xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] font-semibold text-stone-400 ml-1">考え中...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Horizontal Chips */}
            <div className="p-2.5 bg-white border-t border-stone-100 overflow-x-auto shrink-0 flex items-center gap-1.5 no-scrollbar">
              <span className="text-[10px] font-bold text-stone-400 shrink-0 flex items-center gap-1 px-1">
                <Lightbulb className="w-3 h-3 text-amber-500" /> おすすめ:
              </span>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt.text)}
                  disabled={isLoading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-stone-200 text-[10px] font-bold text-stone-600 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  id={`btn-quick-prompt-${idx}`}
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-stone-200/70 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="質問を入力してください（例: 味付けのコツは？）"
                  disabled={isLoading}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  id="input-recipe-chat"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs shrink-0 cursor-pointer"
                  id="btn-send-chat"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
