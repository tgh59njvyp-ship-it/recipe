import React, { useState, useRef, useEffect } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Share2,
  FileText,
  ListChecks,
  Table,
  Check,
  Save,
  Bookmark,
  FolderOpen,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Clock,
  X,
} from "lucide-react";
import { ShoppingItem, SavedShoppingList } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ShoppingListProps {
  shoppingList: ShoppingItem[];
  savedLists?: SavedShoppingList[];
  onToggleItem: (id: string) => void;
  onAddItem: (name: string, quantity: string, category: string) => void;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
  onSaveCurrentList?: (title: string) => void;
  onLoadSavedList?: (savedList: SavedShoppingList) => void;
  onDeleteSavedList?: (id: string) => void;
  onCreateBlankList?: () => void;
}

const CATEGORY_MAP: Record<string, string> = {
  meat: "肉類",
  fish: "魚介類",
  veg: "野菜・果物",
  dairy: "卵・大豆・乳製品",
  pantry: "常備品・乾物",
  seasoning: "調味料",
  other: "その他",
  "肉類": "肉類",
  "魚介類": "魚介類",
  "野菜・果物": "野菜・果物",
  "卵・大豆・乳製品": "卵・大豆・乳製品",
  "常備品・乾物": "常備品・乾物",
  "調味料": "調味料",
  "その他": "その他",
};

const QUICK_PRESETS = [
  { name: "牛乳", category: "卵・大豆・乳製品", quantity: "1本" },
  { name: "卵", category: "卵・大豆・乳製品", quantity: "1パック" },
  { name: "豆腐", category: "卵・大豆・乳製品", quantity: "1個" },
  { name: "納豆", category: "卵・大豆・乳製品", quantity: "1パック" },
  { name: "食パン", category: "常備品・乾物", quantity: "1袋" },
  { name: "もやし", category: "野菜・果物", quantity: "1袋" },
  { name: "玉ねぎ", category: "野菜・果物", quantity: "1袋" },
  { name: "キャベツ", category: "野菜・果物", quantity: "1個" },
  { name: "豚こま肉", category: "肉類", quantity: "1パック" },
  { name: "鶏むね肉", category: "肉類", quantity: "1パック" },
];

export default function ShoppingList({
  shoppingList,
  savedLists = [],
  onToggleItem,
  onAddItem,
  onRemoveItem,
  onClearCompleted,
  onSaveCurrentList,
  onLoadSavedList,
  onDeleteSavedList,
  onCreateBlankList,
}: ShoppingListProps) {
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemCategory, setItemCategory] = useState("その他");
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedListsModal, setShowSavedListsModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);

  // Helper function to safely sanitize IDs for HTML/CSS selectors
  const sanitizeId = (str: string) => {
    return (str || "id").replace(/[^a-zA-Z0-9_-]/g, "_");
  };

  // Close share menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemName.trim()) {
      onAddItem(itemName.trim(), itemQuantity.trim() || "必要な分量", itemCategory);
      setItemName("");
      setItemQuantity("");
      setItemCategory("その他");
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;
    if (onSaveCurrentList) {
      onSaveCurrentList(saveTitle.trim());
      setSaveTitle("");
      setShowSaveModal(false);
      setCopiedMessage("リストを保存しました！");
      setTimeout(() => setCopiedMessage(null), 2500);
    }
  };

  // Safe Date string formatter
  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Group items by category
  const groupedItems = shoppingList.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const category = CATEGORY_MAP[item.category] || item.category || "その他";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Safe Copy formatting function
  const handleCopyFormat = async (formatType: "line" | "plain" | "markdown" | "csv", onlyActive: boolean = true) => {
    const targetItems = onlyActive ? shoppingList.filter((item) => !item.completed) : shoppingList;
    if (targetItems.length === 0) {
      alert("コピーするアイテムがありません。");
      return;
    }

    let text = "";
    const title = onlyActive ? "🛒 買い出しリスト（未購入品）" : "🛒 買い出しリスト（全アイテム）";

    if (formatType === "line") {
      text = `${title}\n`;
      const grouped = targetItems.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
        const cat = CATEGORY_MAP[item.category] || item.category || "その他";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {});

      for (const [cat, items] of Object.entries(grouped)) {
        text += `\n【${cat}】\n`;
        items.forEach((i) => {
          text += `□ ${i.name} (${i.quantity})\n`;
        });
      }
    } else if (formatType === "plain") {
      text = `${title}\n`;
      targetItems.forEach((i) => {
        const cat = CATEGORY_MAP[i.category] || i.category || "その他";
        text += `• ${i.name}：${i.quantity} [${cat}]\n`;
      });
    } else if (formatType === "markdown") {
      text = `# ${title}\n\n`;
      targetItems.forEach((i) => {
        const cat = CATEGORY_MAP[i.category] || i.category || "その他";
        text += `- [ ] ${i.name} (${i.quantity}) *[${cat}]*\n`;
      });
    } else if (formatType === "csv") {
      text = "品名,分量,カテゴリ,状態\n";
      targetItems.forEach((i) => {
        const cat = CATEGORY_MAP[i.category] || i.category || "その他";
        text += `"${i.name}","${i.quantity}","${cat}","${i.completed ? "購入済み" : "未購入"}"\n`;
      });
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedMessage("コピーしました！");
      setShowShareMenu(false);
      setTimeout(() => setCopiedMessage(null), 2500);
    } catch (e) {
      console.error("Clipboard copy failed safely", e);
    }
  };

  const handleNativeShare = async () => {
    const activeItems = shoppingList.filter((item) => !item.completed);
    if (activeItems.length === 0) {
      alert("共有する未購入のアイテムがありません。");
      return;
    }

    const text =
      "■ 買い出しリスト\n" +
      activeItems.map((i) => `・${i.name} (${i.quantity})`).join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "買い出しリスト",
          text: text,
        });
        setShowShareMenu(false);
      } catch (err) {
        // Silently ignore share cancellation or error
      }
    } else {
      handleCopyFormat("line", true);
    }
  };

  const totalItems = shoppingList.length;
  const completedItems = shoppingList.filter((item) => item.completed).length;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm relative" id="shopping-list-container">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span>買い出しリスト</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            自由に追加・編集したり、名前をつけて保存、いつでも呼び出すことができます
          </p>
        </div>

        {/* Management Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Start from scratch / Blank button */}
          <button
            onClick={() => {
              if (totalItems > 0) {
                if (confirm("現在のリストを消去して、最初から新しい買い物リストを作成しますか？")) {
                  if (onCreateBlankList) onCreateBlankList();
                }
              } else {
                if (onCreateBlankList) onCreateBlankList();
              }
            }}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            id="btn-blank-shopping-list"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>最初から作成</span>
          </button>

          {/* Save List Button */}
          {totalItems > 0 && onSaveCurrentList && (
            <button
              onClick={() => {
                const defaultTitle = `買い物リスト (${new Date().toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })})`;
                setSaveTitle(defaultTitle);
                setShowSaveModal(true);
              }}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              id="btn-open-save-list-modal"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
              <span>このリストを保存</span>
            </button>
          )}

          {/* Saved Lists Drawer / Modal Toggle */}
          {savedLists.length > 0 && (
            <button
              onClick={() => setShowSavedListsModal(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/70 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-view-saved-lists"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>保存済みリスト ({savedLists.length})</span>
            </button>
          )}

          {/* Share & Copy Button */}
          {totalItems > 0 && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowShareMenu((prev) => !prev)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                id="btn-share-shopping-menu"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{copiedMessage}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>共有・コピー</span>
                  </>
                )}
              </button>

              {/* Share/Copy Dropdown Menu */}
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 text-left"
                >
                  <div className="px-3 py-1.5 border-b border-stone-100">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      共有・コピー形式を選択
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyFormat("line", true)}
                    className="w-full px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    id="btn-copy-line"
                  >
                    <span className="text-base">📱</span>
                    <div>
                      <p className="font-bold">LINE・チャット用</p>
                      <p className="text-[10px] text-stone-400">未購入品をカテゴリ別に絵文字付きでコピー</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCopyFormat("plain", true)}
                    className="w-full px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    id="btn-copy-plain"
                  >
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">シンプルテキスト</p>
                      <p className="text-[10px] text-stone-400">メモアプリ等にそのまま貼り付け</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCopyFormat("markdown", true)}
                    className="w-full px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    id="btn-copy-markdown"
                  >
                    <ListChecks className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Markdown チェックリスト</p>
                      <p className="text-[10px] text-stone-400">NotionやGitHub等で使用</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCopyFormat("csv", true)}
                    className="w-full px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    id="btn-copy-csv"
                  >
                    <Table className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">CSV形式</p>
                      <p className="text-[10px] text-stone-400">Excelやスプレッドシート用</p>
                    </div>
                  </button>

                  {typeof navigator.share === "function" && (
                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        onClick={handleNativeShare}
                        className="w-full px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        id="btn-native-share"
                      >
                        <Share2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold">端末の共有機能を使う (LINE/メール等)</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {completedItems > 0 && (
            <button
              onClick={onClearCompleted}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              id="btn-clear-completed-shopping"
            >
              チェック済を削除
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {totalItems > 0 && (
        <div className="mb-6 bg-stone-50 p-4 rounded-xl border border-stone-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-stone-600">買い出しの準備状況</span>
            <span className="text-xs font-mono font-bold text-emerald-600">
              {completedItems} / {totalItems} 品用意済み ({Math.round((completedItems / totalItems) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${(completedItems / totalItems) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Add Presets (For manual creation) */}
      <div className="mb-6 bg-stone-50/70 p-3.5 rounded-xl border border-stone-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>定番・人気の食材をワンタップ追加</span>
          </span>
          <span className="text-[10px] text-stone-400">手動作成に便利</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onAddItem(preset.name, preset.quantity, preset.category)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-stone-700 text-xs font-semibold rounded-lg border border-stone-200 shadow-3xs transition-all flex items-center gap-1 cursor-pointer"
              id={`btn-quick-preset-${idx}`}
            >
              <Plus className="w-3 h-3 text-emerald-600" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom Item Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-6" id="form-add-custom-shopping">
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="買いたい物を入力... (例: パスタ、洗剤)"
          className="sm:col-span-2 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-stone-50/20"
          id="input-custom-shopping-name"
        />
        <input
          type="text"
          value={itemQuantity}
          onChange={(e) => setItemQuantity(e.target.value)}
          placeholder="分量 (例: 1袋、500g)"
          className="px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-stone-50/20"
          id="input-custom-shopping-quantity"
        />
        <select
          value={itemCategory}
          onChange={(e) => setItemCategory(e.target.value)}
          className="px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-stone-50/20 text-stone-700"
          id="select-custom-shopping-category"
        >
          <option value="肉類">肉類</option>
          <option value="魚介類">魚介類</option>
          <option value="野菜・果物">野菜・果物</option>
          <option value="卵・大豆・乳製品">卵・大豆・乳製品</option>
          <option value="常備品・乾物">常備品・乾物</option>
          <option value="調味料">調味料</option>
          <option value="その他">その他</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
          id="btn-add-custom-shopping"
        >
          <Plus className="w-4 h-4" />
          <span>追加</span>
        </button>
      </form>

      {/* List content */}
      {totalItems === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-2xl p-6 bg-stone-50/30">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-stone-700">現在、買い物リストは空です</p>
          <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
            AIで献立を生成して全食材をリストインするほか、上のフォームやワンタップタグを使って**最初から自由に必要な買い出し品を手動入力**できます。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-bold text-stone-500 tracking-wide bg-stone-100/80 px-2.5 py-1 rounded-lg inline-block">
                {category} ({items.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <AnimatePresence>
                  {items.map((item) => {
                    const safeId = sanitizeId(item.id);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          item.completed
                            ? "bg-stone-50/70 border-stone-200/60 text-stone-400 line-through"
                            : "bg-white border-stone-200/80 shadow-3xs text-stone-700"
                        }`}
                        id={`shopping-row-${safeId}`}
                      >
                        <button
                          onClick={() => onToggleItem(item.id)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left focus:outline-none cursor-pointer"
                          id={`btn-toggle-shopping-${safeId}`}
                        >
                          {item.completed ? (
                            <CheckSquare className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4.5 h-4.5 text-stone-300 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${item.completed ? "text-stone-400" : ""}`}>
                              {item.name}
                            </p>
                            {item.recipeTitle && (
                              <p className="text-[10px] text-stone-400 truncate mt-0.5 no-underline">
                                {item.recipeTitle}
                              </p>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className={`text-xs font-mono ${item.completed ? "text-stone-300" : "text-stone-500 font-bold"}`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1.5 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50/50 transition-colors cursor-pointer no-underline"
                            id={`btn-delete-shopping-${safeId}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Save List */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-stone-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2 text-stone-800 font-bold">
                  <Bookmark className="w-5 h-5 text-amber-500" />
                  <span>買い物リストを名前を付けて保存</span>
                </div>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-stone-500">
                現在のリスト({totalItems}品)を保存して、後からいつでも簡単に読み込めるようにします。
              </p>

              <form onSubmit={handleSaveSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    リストのタイトル
                  </label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="例: 8/15 週末まとめ買い"
                    className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="px-4 py-2 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>保存する</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Saved Lists Manager */}
      <AnimatePresence>
        {showSavedListsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-stone-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 shrink-0">
                <div className="flex items-center gap-2 text-stone-800 font-bold">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                  <span>保存済み買い物リスト一覧 ({savedLists.length})</span>
                </div>
                <button
                  onClick={() => setShowSavedListsModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {savedLists.map((saved) => (
                  <div
                    key={saved.id}
                    className="p-4 rounded-2xl border border-stone-200/80 bg-stone-50/50 hover:bg-indigo-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-stone-800 text-sm">{saved.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-stone-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(saved.createdAt)}
                        </span>
                        <span>{saved.items.length}品</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (onLoadSavedList) {
                            onLoadSavedList(saved);
                            setShowSavedListsModal(false);
                            setCopiedMessage("リストを読み込みました！");
                            setTimeout(() => setCopiedMessage(null), 2500);
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>読み込む</span>
                      </button>

                      {onDeleteSavedList && (
                        <button
                          onClick={() => onDeleteSavedList(saved.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-stone-100 flex justify-end shrink-0">
                <button
                  onClick={() => setShowSavedListsModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  閉じる
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
