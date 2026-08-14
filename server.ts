import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS and JSON body parsing
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-api-key");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

function getAIClient(clientApiKey?: string) {
  const trimmedClient = clientApiKey?.trim();
  const envKey = process.env.GEMINI_API_KEY?.trim();
  
  // Prefer valid client-provided key or environment variable
  const apiKey = (trimmedClient && trimmedClient.length > 10) ? trimmedClient : envKey;
  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey,
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Helper to attempt generation with valid modern Gemini models and automatic schema fallbacks
async function generateContentWithFallback(ai: GoogleGenAI, configObj: { contents: any; config?: any }) {
  // Ordered by reliability and speed under high traffic
  const candidateModels = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];
  let lastError: any = null;

  // First pass: try with structured output schema across available models
  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        ...configObj,
        model: modelName,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`Model [${modelName}] failed with schema:`, err?.message || err);
      lastError = err;
      // If 503 (high demand) or rate limit, continue immediately to the next candidate model
    }
  }

  // Second pass fallback: try without strict responseSchema if structured outputs failed
  if (configObj.config?.responseSchema) {
    const simplifiedConfig = {
      ...configObj.config,
      responseSchema: undefined,
      responseMimeType: "application/json",
    };
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          contents: configObj.contents,
          config: simplifiedConfig,
          model: modelName,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        console.warn(`Model [${modelName}] fallback without responseSchema failed:`, err?.message || err);
        lastError = err;
      }
    }
  }

  throw lastError || new Error("AIモデルからの応答取得に失敗しました。");
}

// API Route for Meal Plan generation
app.post("/api/generate-plan", async (req, res) => {
  try {
    const clientApiKey = (req.headers["x-api-key"] as string) || req.body?.apiKey;
    const ai = getAIClient(clientApiKey);
    if (!ai) {
      return res.status(401).json({
        error: "Gemini APIキーが設定されていません。ヘッダーの『🔑 APIキー設定』ボタンからGoogle Gemini APIキーを設定してください（Google AI Studioで無料取得できます）。",
        requiresApiKey: true,
      });
    }

    const { availableIngredients, dietaryRestrictions, cookingStyle, mealCount, mealType, additionalNotes } = req.body;

    if (!availableIngredients || !Array.isArray(availableIngredients) || availableIngredients.length === 0) {
      return res.status(400).json({
        error: "使いたい食材を1つ以上入力してください。",
      });
    }

    const prompt = `
あなたは優秀な管理栄養士、そしてプロの料理研究家です。
ユーザーが指定した「手持ちの食材（使いたい食材）」を最大限活用した、美味しくてバランスの良い献立プランを考案してください。

■ 条件
1. 使いたい食材（これらはすでにあるため、買い足す必要がなければ買い出しリストから除外するか isMissing を false にしてください）:
${availableIngredients.map((i: string) => ` - ${i}`).join("\n")}

2. 食事の形式・回数:
${mealType} (${mealCount}品/日)

3. 料理スタイル（和食、洋食、中華、イタリアン、エスニック、韓国料理などの指定がある場合）:
${cookingStyle || "指定なし"}

4. 食事の制限・テーマ（ベジタリアン、ビーガン、グルテンフリー、糖質制限、減塩、乳製品不使用、ヘルシーなどの指定がある場合）:
${dietaryRestrictions && dietaryRestrictions.length > 0 ? dietaryRestrictions.join(", ") : "特になし"}

5. 追加の要望・メモ:
${additionalNotes || "特になし"}

■ 出力ルール
- 指定された料理スタイル（指定なし以外）や食事の制限・テーマに厳格に沿ったメニュー構成にしてください。例えば、ビーガンの場合は動物性食材を一切使わず、グルテンフリーの場合は小麦粉を使用する調味料や麺などを代替・除外してください。
- 使いたい食材をなるべく無駄なく使い切れる献立を考案してください。
- ユーザーの手持ち食材に含まれない、または新たに買い足す必要がある食材は、材料リストの \`isMissing\` を \`true\` に指定してください（これにより、自動で買い出しリストが作成されます）。
- 基本的な調味料（塩、コショウ、醤油、砂糖、みりん、酒、油、米など）は一般的な家庭にあるものと想定し、\`isMissing\` を \`false\` に設定してください。
- 各レシピの手順（instructions）は分かりやすく、ステップバイステップで説明してください。
- 栄養価（カロリー、タンパク質、炭水化物、脂質）を推定して含めてください。
`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "あなたは親切でプロフェッショナルな管理栄養士です。指定された形式のJSONデータのみを返してください。マークダウンの囲みや余計なテキストは含めないでください。",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "献立全体のテーマやタイトル（例: 「冷蔵庫すっきり！手軽に楽しむ中華・和食献立」）",
            },
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "料理名" },
                  description: { type: Type.STRING, description: "料理の簡単な魅力や特徴、おすすめポイント" },
                  prepTime: { type: Type.INTEGER, description: "下準備時間（分）" },
                  cookTime: { type: Type.INTEGER, description: "調理時間（分）" },
                  servings: { type: Type.INTEGER, description: "分量の人数（通常は2人前を推奨）" },
                  difficulty: {
                    type: Type.STRING,
                    description: "「簡単」「普通」「こだわり」のいずれか",
                  },
                  mealType: {
                    type: Type.STRING,
                    description: "「主食」「主菜」「副菜」「汁物」「おつまみ」などのカテゴリ",
                  },
                  ingredients: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "食材・調味料の名前" },
                        quantity: { type: Type.STRING, description: "分量（例: 150g, 1/2個, 大さじ1 など）" },
                        category: {
                          type: Type.STRING,
                          description: "「肉類」「魚介類」「野菜・果物」「卵・大豆・乳製品」「常備品・乾物」「調味料」「その他」のいずれか",
                        },
                        isMissing: {
                          type: Type.BOOLEAN,
                          description: "ユーザーの手元になく、新しく買い足す必要がある場合はtrue、手元にある（使いたい食材として指定された、または一般的な家庭の調味料など）場合はfalse",
                        },
                      },
                      required: ["name", "quantity", "category", "isMissing"],
                    },
                  },
                  instructions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "作り方の手順（分かりやすい順番）",
                  },
                  nutrition: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.INTEGER, description: "推定カロリー (kcal)" },
                      protein: { type: Type.INTEGER, description: "タンパク質 (g)" },
                      carbs: { type: Type.INTEGER, description: "炭水化物 (g)" },
                      fat: { type: Type.INTEGER, description: "脂質 (g)" },
                    },
                    required: ["calories", "protein", "carbs", "fat"],
                  },
                },
                required: ["title", "description", "prepTime", "cookTime", "servings", "difficulty", "mealType", "ingredients", "instructions", "nutrition"],
              },
            },
          },
          required: ["title", "recipes"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      return res.status(500).json({
        error: "AIからの応答が空でした。『AIに献立を考えてもらう』ボタンを押して再試行してください。",
      });
    }

    let cleanJson = responseText.trim();

    // Strip markdown fences if present
    if (cleanJson.includes("```")) {
      cleanJson = cleanJson.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    }

    // Isolate outer JSON object structure if text prefix/suffix exists
    const firstBrace = cleanJson.indexOf("{");
    const lastBrace = cleanJson.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJson = cleanJson.slice(firstBrace, lastBrace + 1);
    }

    let data: any = null;
    try {
      data = JSON.parse(cleanJson);
    } catch (parseError: any) {
      // Secondary attempt: fix trailing commas and unescaped line breaks
      try {
        const sanitized = cleanJson
          .replace(/,\s*([\}\]])/g, "$1")
          .replace(/[\u0000-\u001F]+/g, (match) => (match === "\n" || match === "\r" || match === "\t" ? match : " "));
        data = JSON.parse(sanitized);
      } catch (secErr) {
        console.error("JSON parse failed. Raw response:", responseText);
        return res.status(500).json({
          error: "AIの生成結果が期待される形式と一致しませんでした。一時的な不整合の可能性があります。お手数ですが『AIに献立を考えてもらう』ボタンを再度押して再試行してください。",
        });
      }
    }

    // Verify and sanitize structure
    if (!data || typeof data !== "object" || !Array.isArray(data.recipes) || data.recipes.length === 0) {
      return res.status(500).json({
        error: "AIの生成結果に必要なレシピデータが含まれていませんでした。恐れ入りますが『AIに献立を考えてもらう』ボタンを再度押して再試行してください。",
      });
    }

    // Ensure title exists
    if (!data.title) {
      data.title = `${availableIngredients.slice(0, 3).join("・")}を活用したおすすめ献立`;
    }

    // Sanitize recipes with safe defaults
    data.recipes = data.recipes.map((r: any, idx: number) => ({
      title: r.title || `おすすめ料理 ${idx + 1}`,
      description: r.description || "手持ちの食材を活かした美味しくてバランスの良い一品です。",
      prepTime: Number(r.prepTime) || 10,
      cookTime: Number(r.cookTime) || 15,
      servings: Number(r.servings) || 2,
      difficulty: r.difficulty || "普通",
      mealType: r.mealType || (idx === 0 ? "主菜" : "副菜"),
      ingredients: Array.isArray(r.ingredients)
        ? r.ingredients.map((ing: any) => ({
            name: typeof ing === "string" ? ing : ing.name || "食材",
            quantity: typeof ing === "string" ? "適量" : ing.quantity || "適量",
            category: ing.category || "その他",
            isMissing: Boolean(ing.isMissing),
          }))
        : [],
      instructions: Array.isArray(r.instructions)
        ? r.instructions.map((inst: any) => String(inst))
        : ["食材を切って下準備をします。", "火を通して味付けを調えます。", "器に盛り付けて完成です。"],
      nutrition: {
        calories: Number(r.nutrition?.calories) || 350,
        protein: Number(r.nutrition?.protein) || 15,
        carbs: Number(r.nutrition?.carbs) || 30,
        fat: Number(r.nutrition?.fat) || 10,
      },
    }));

    return res.json(data);
  } catch (error: any) {
    console.error("Meal generation error:", error);
    const msg = error?.message || String(error);
    if (msg.includes("401") || msg.includes("UNAUTHENTICATED") || msg.includes("authentication credential") || msg.includes("ACCESS_TOKEN")) {
      return res.status(401).json({
        requiresApiKey: true,
        error: "Gemini APIキーの認証に失敗しました。画面右上の『🔑 APIキー設定』から、Google AI Studioで取得した有効なAPIキー（AIzaSy...）を設定してください。",
      });
    }
    return res.status(500).json({
      error: "献立の作成中にエラーが発生しました。お手数ですが再試行してください。 (詳細: " + msg + ")",
    });
  }
});

// API Route for Recipe & Cooking Assistant Chat
app.post("/api/chat", async (req, res) => {
  try {
    const clientApiKey = (req.headers["x-api-key"] as string) || req.body?.apiKey;
    const ai = getAIClient(clientApiKey);
    if (!ai) {
      return res.status(401).json({
        error: "Gemini APIキーが設定されていません。画面右上『🔑 APIキー設定』ボタンからGoogle Gemini APIキーを入力してください。",
        requiresApiKey: true,
      });
    }

    const { message, history, context } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "メッセージを入力してください。",
      });
    }

    let contextText = "";
    if (context) {
      if (context.recipeTitle) {
        contextText += `\n【現在参照中のレシピ】\n料理名: ${context.recipeTitle}`;
      }
      if (context.ingredients && Array.isArray(context.ingredients)) {
        contextText += `\n材料: ${context.ingredients.map((i: any) => `${i.name}${i.quantity ? ` (${i.quantity})` : ""}`).join(", ")}`;
      }
      if (context.instructions && Array.isArray(context.instructions)) {
        contextText += `\n作り方の手順:\n${context.instructions.map((ins: string, idx: number) => `${idx + 1}. ${ins}`).join("\n")}`;
      }
      if (context.availableIngredients && Array.isArray(context.availableIngredients)) {
        contextText += `\n手持ちの食材: ${context.availableIngredients.join(", ")}`;
      }
    }

    const systemInstruction = `あなたは親切で温かく、専門知識が豊富な料理研究家・管理栄養士の「AIクッキングパートナー」です。
料理初心者からの質問にも分かりやすく丁寧に教えてください。

【主な回答範囲】
- レシピの疑問解消（手順のコツ、火加減、切り方、下処理）
- 食材の代用案（調味料や食材がない場合のおすすめ代替品とその割合）
- 保存方法・日持ち（余った野菜や作り置きの保存テクニック）
- 栄養アドバイス・アレンジ提案（子供向け、おつまみ風、低糖質化など）
- 食材の選び方や下ごしらえ

${contextText}

【回答のスタイル】
- 親しみやすく前向きな言葉遣い（〜ですよ！、〜すると美味しくなります♪ など）
- 読みやすいように箇条書きや太字を必要に応じて活用してください。
- 長すぎず、パッと読んで要点が伝わるように答えてください。`;

    const contents: any[] = [];
    
    // Add history if present
    if (Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      }
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await generateContentWithFallback(ai, {
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || "申し訳ありません。回答を生成できませんでした。";
    return res.json({ reply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    const msg = error?.message || String(error);
    if (msg.includes("401") || msg.includes("UNAUTHENTICATED") || msg.includes("authentication credential") || msg.includes("ACCESS_TOKEN")) {
      return res.status(401).json({
        requiresApiKey: true,
        error: "Gemini APIキーの認証に失敗しました。画面右上の『🔑 APIキー設定』から、Google AI Studioで取得した有効なAPIキーを設定してください。",
      });
    }
    return res.status(500).json({
      error: "回答の取得中にエラーが発生しました。詳細: " + msg,
    });
  }
});

// Setup Vite Dev Server / Static Assets serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
