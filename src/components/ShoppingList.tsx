import React, { useState, useRef, useEffect } from "react";
import { CheckSquare, Square, Plus, Trash2, Copy, Check, Share2, FileText, ListChecks, Table } from "lucide-react";
import { ShoppingItem } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ShoppingListProps {
  shoppingList: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onAddItem: (name: string, quantity: string, category: string) => void;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
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

export default function ShoppingList({
  shoppingList,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  onClearCompleted,
}: ShoppingListProps) {
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemCategory, setItemCategory] = useState("その他");
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

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

  // Group items by category
  const groupedItems = shoppingList.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const category = CATEGORY_MAP[item.category] || item.category || "その他";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Copy formatting functions
  const handleCopyFormat = (formatType: "line" | "plain" | "markdown" | "csv", onlyActive: boolean = true) => {
    const targetItems = onlyActive ? shoppingList.filter((item) => !item.completed) : shoppingList;
    if (targetItems.length === 0) {
      alert("コピーするアイテムがありません。");
      return;
    }

    let text = "";
    const title = onlyActive ? "🛒 買い出しリスト（未購入品）" : "🛒 買い出しリスト（全アイテム）";

    if (formatType === "line") {
      // LINE friendly with emojis
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
      // Plain text list
      text = `${title}\n`;
      targetItems.forEach((i) => {
        const cat = CATEGORY_MAP[i.category] || i.category || "その他";
        text += `• ${i.name}：${i.quantity} [${cat}]\n`;
      });
    } else if (formatType === "markdown") {
      // Markdown checklist
      text = `# ${title}\n\n`;
      targetItems.forEach((i) => {
        const cat = CATEGORY_MAP[i.category] || i.category || "その他";
        text += `- [ ] ${i.name} (${i.quantity}) *[${cat}]*\n`;
      });
    } else if (formatType === "csv") {
      // CSV format
      text = "品名,分量,カテゴリ,状態\n";
      targetItems.forEach((i) => {
        const cat = CATEGORY_MAP[i.category] || i.category || "その他";
        text += `"${i.name}","${i.quantity}","${cat}","${i.completed ? "購入済み" : "未購入"}"\n`;
      });
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessage("コピーしました！");
      setShowShareMenu(false);
      setTimeout(() => setCopiedMessage(null), 2500);
    });
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
        // user cancelled or share failed
      }
    } else {
      handleCopyFormat("line", true);
    }
  };

  const totalItems = shoppingList.length;
  const completedItems = shoppingList.filter((item) => item.completed).length;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm relative" id="shopping-list-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-stone-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-stone-800">2. 買い出しリスト</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            献立の全食材がリストアップされています。家にあるものはチェックを入れて除外できます
          </p>
        </div>

        {totalItems > 0 && (
          <div className="flex items-center gap-2 shrink-0 relative" ref={menuRef}>
            {/* Share & Copy Button */}
            <div className="relative">
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
        )}
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
          <p className="text-[10px] text-stone-400 mt-1.5">
            ※ 家にある食材はチェックがついているため、買い足す必要のある未チェックのアイテムを確認してスーパーに行きましょう！
          </p>
        </div>
      )}

      {/* Add Custom Item Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-6" id="form-add-custom-shopping">
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="買うものを追加... (例: 牛乳)"
          className="sm:col-span-2 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-stone-50/20"
          id="input-custom-shopping-name"
        />
        <input
          type="text"
          value={itemQuantity}
          onChange={(e) => setItemQuantity(e.target.value)}
          placeholder="量 (例: 1本)"
          className="px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-stone-50/20"
          id="input-custom-shopping-quantity"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
          id="btn-add-custom-shopping"
        >
          <Plus className="w-4 h-4" />
          <span>追加</span>
        </button>
      </form>

      {/* List content */}
      {totalItems === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-stone-100 rounded-xl">
          <p className="text-sm text-stone-400">
            現在、買い出しリストはありません。
          </p>
          <p className="text-xs text-stone-400 mt-1">
            献立を自動作成すると、使用する全ての食材がここに表示されます。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-bold text-stone-400 tracking-wide bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-100 inline-block">
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        item.completed
                          ? "bg-stone-50/70 border-stone-200/60 text-stone-400 line-through"
                          : "bg-white border-stone-100 shadow-3xs text-stone-700"
                      }`}
                      id={`shopping-item-row-${item.id}`}
                    >
                      <button
                        onClick={() => onToggleItem(item.id)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left focus:outline-none cursor-pointer"
                        id={`btn-toggle-shopping-${item.id}`}
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
                          id={`btn-delete-shopping-${item.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
