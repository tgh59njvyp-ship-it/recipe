import { GoogleGenAI, Type } from "@google/genai";
import { MealPlan, Recipe, ShoppingItem } from "../types";
import { buildFallbackMealPlan } from "./recipePresets";

export function getEffectiveApiKey(customKey?: string): string {
  const localKey = (typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : null)?.trim();
  const candidate = customKey?.trim() || localKey;
  if (candidate && candidate.length > 5) {
    return candidate;
  }
  return "";
}

export interface GeneratePlanParams {
  availableIngredients: string[];
  dietaryRestrictions: string[];
  cookingStyle: string;
  mealCount: number;
  mealType: string;
  additionalNotes?: string;
  apiKey?: string;
}

async function generateWithREST(apiKey: string, prompt: string, schema?: any): Promise<string> {
  const candidateModels = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];
  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const body: any = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          ...(schema ? { responseSchema: schema } : {}),
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn(`REST call failed for ${model}:`, e);
    }
  }
  return "";
}

export async function generateMealPlan(params: GeneratePlanParams): Promise<{ title: string; recipes: any[]; isDemo?: boolean }> {
  const effectiveKey = getEffectiveApiKey(params.apiKey);

  // 1. First try server endpoint
  try {
    const response = await fetch("/api/generate-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(effectiveKey ? { "x-api-key": effectiveKey } : {}),
      },
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.recipes && data.recipes.length > 0) {
        return data;
      }
    } else {
      const errJson = await response.json().catch(() => null);
      if (errJson?.requiresApiKey || response.status === 401) {
        // If server requires API key and client doesn't have one, generate smart recipe template smoothly
        if (!effectiveKey) {
          console.info("No API key available, using smart chef template engine.");
          const fallbackData = buildFallbackMealPlan(params.availableIngredients, params.mealType, params.mealCount);
          return {
            ...fallbackData,
            isDemo: true,
          };
        }
      }
      if (errJson?.error) {
        throw new Error(errJson.error);
      }
    }
  } catch (serverErr: any) {
    if (serverErr?.message && serverErr.message.includes("食材を1つ以上")) {
      throw serverErr;
    }
    console.warn("Server API returned error. Trying client-side fallback if key is present:", serverErr);
  }

  // 2. Client-side fallback with @google/genai if a client key is available
  if (!effectiveKey) {
    // Gracefully provide high-quality recipe plan tailored to user's ingredients
    const fallbackData = buildFallbackMealPlan(params.availableIngredients, params.mealType, params.mealCount);
    return {
      ...fallbackData,
      isDemo: true,
    };
  }

  const ai = new GoogleGenAI({ apiKey: effectiveKey });

  const prompt = `
あなたは優秀な管理栄養士、そしてプロの料理研究家です。
ユーザーが指定した「手持ちの食材（使いたい食材）」を最大限活用した、美味しくてバランスの良い献立プランを考案してください。

■ 条件
1. 使いたい食材（これらはすでにあるため、買い足す必要がなければ買い出しリストから除外するか isMissing を false にしてください）:
${params.availableIngredients.map((i) => ` - ${i}`).join("\n")}

2. 食事の形式・回数:
${params.mealType} (${params.mealCount}品/日)

3. 料理スタイル（和食、洋食、中華、イタリアン、エスニック、韓国料理などの指定がある場合）:
${params.cookingStyle || "指定なし"}

4. 食事の制限・テーマ（ベジタリアン、ビーガン、グルテンフリー、糖質制限、減塩、乳製品不使用、ヘルシーなどの指定がある場合）:
${params.dietaryRestrictions && params.dietaryRestrictions.length > 0 ? params.dietaryRestrictions.join(", ") : "特になし"}

5. 追加の要望・メモ:
${params.additionalNotes || "特になし"}

■ 出力ルール
- 指定された料理スタイルや食事制限に厳格に沿ったメニュー構成にしてください。
- 使いたい食材をなるべく無駄なく使い切れる献立を考案してください。
- ユーザーの手持ち食材に含まれない、または新たに買い足す必要がある食材は、材料リストの \`isMissing\` を \`true\` に指定してください。
- 基本的な調味料（塩、コショウ、醤油、砂糖、みりん、酒、油、米など）は \`isMissing\` を \`false\` に設定してください。
- 各レシピの手順（instructions）は分かりやすく、ステップバイステップで説明してください。
- 栄養価（カロリー、タンパク質、炭水化物、脂質）を推定して含めてください。
`;

  const candidateModels = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];
  let rawText = "";

  for (const model of candidateModels) {
    try {
      const resp = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "あなたは親切でプロフェッショナルな管理栄養士です。指定されたJSONフォーマットのテキストのみを返してください。マークダウンの囲み（```json等）や余分な解説文は含めず、純粋なJSONオブジェクトを出力してください。",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "献立全体のテーマやタイトル",
              },
              recipes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "料理名" },
                    description: { type: Type.STRING, description: "料理の簡単な説明" },
                    prepTime: { type: Type.NUMBER, description: "下準備時間（分）" },
                    cookTime: { type: Type.NUMBER, description: "調理時間（分）" },
                    servings: { type: Type.NUMBER, description: "何人前か" },
                    difficulty: {
                      type: Type.STRING,
                      description: "難易度（'簡単', '普通', 'こだわり'のいずれか）",
                    },
                    mealType: { type: Type.STRING, description: "主菜、副菜、汁物、主食など" },
                    ingredients: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "材料名" },
                          quantity: { type: Type.STRING, description: "分量（例: '1本', '1/2個', '大さじ1'）" },
                          category: {
                            type: Type.STRING,
                            description: "カテゴリ（野菜, 肉・魚, 卵・乳製品, 豆腐・豆類, 調味料, 主食・粉類, その他）",
                          },
                          isMissing: {
                            type: Type.BOOLEAN,
                            description: "ユーザーの手持ちに無く、買い足しが必要な食材なら true",
                          },
                        },
                        required: ["name", "quantity", "category", "isMissing"],
                      },
                    },
                    instructions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "調理手順の配列（番号なしでステップごとに記述）",
                    },
                    nutrition: {
                      type: Type.OBJECT,
                      properties: {
                        calories: { type: Type.NUMBER, description: "推定カロリー (kcal)" },
                        protein: { type: Type.NUMBER, description: "タンパク質 (g)" },
                        carbs: { type: Type.NUMBER, description: "炭水化物 (g)" },
                        fat: { type: Type.NUMBER, description: "脂質 (g)" },
                      },
                    },
                  },
                  required: ["title", "description", "prepTime", "cookTime", "servings", "difficulty", "ingredients", "instructions"],
                },
              },
            },
            required: ["title", "recipes"],
          },
        },
      });

      if (resp && resp.text) {
        rawText = resp.text;
        break;
      }
    } catch (e) {
      console.warn(`Client model [${model}] generation failed:`, e);
    }
  }

  // If structured generation failed, try freeform JSON
  if (!rawText) {
    for (const model of candidateModels) {
      try {
        const resp = await ai.models.generateContent({
          model,
          contents: prompt + "\n必ず有効なJSONフォーマット（{ title: string, recipes: Recipe[] }）で出力してください。",
          config: {
            responseMimeType: "application/json",
          },
        });
        if (resp && resp.text) {
          rawText = resp.text;
          break;
        }
      } catch (e) {
        console.warn(`Client fallback without schema failed on [${model}]:`, e);
      }
    }
  }

  // If SDK failed (e.g. auth issue with AQ keys), try direct REST API
  if (!rawText && effectiveKey) {
    try {
      rawText = await generateWithREST(effectiveKey, prompt);
    } catch (e) {
      console.warn("Direct REST fallback failed:", e);
    }
  }

  if (!rawText) {
    const fallbackData = buildFallbackMealPlan(params.availableIngredients, params.mealType, params.mealCount);
    return {
      ...fallbackData,
      isDemo: true,
    };
  }

  let cleanJson = rawText.trim();
  if (cleanJson.startsWith("```json")) {
    cleanJson = cleanJson.slice(7);
  }
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.slice(3);
  }
  if (cleanJson.endsWith("```")) {
    cleanJson = cleanJson.slice(0, -3);
  }
  cleanJson = cleanJson.trim();

  const firstBrace = cleanJson.indexOf("{");
  const lastBrace = cleanJson.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanJson = cleanJson.slice(firstBrace, lastBrace + 1);
  }

  let data: any = null;
  try {
    data = JSON.parse(cleanJson);
  } catch {
    const sanitized = cleanJson
      .replace(/,\s*([\}\]])/g, "$1")
      .replace(/[\u0000-\u001F]+/g, (m) => (m === "\n" || m === "\r" || m === "\t" ? m : " "));
    data = JSON.parse(sanitized);
  }

  if (!data || !Array.isArray(data.recipes) || data.recipes.length === 0) {
    throw new Error("レシピデータの解析に失敗しました。もう一度お試しください。");
  }

  if (!data.title) {
    data.title = `${params.availableIngredients.slice(0, 3).join("・")}を活用したおすすめ献立`;
  }

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

  return data;
}

export async function askChefChat(
  message: string,
  history: Array<{ role: "user" | "model"; parts: string }>,
  currentMealPlan?: MealPlan | null,
  apiKey?: string
): Promise<string> {
  // Try server first
  try {
    const effectiveKey = getEffectiveApiKey(apiKey);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": effectiveKey,
      },
      body: JSON.stringify({ message, history, currentMealPlan }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.reply) return data.reply;
    }
  } catch (err) {
    console.warn("Server chat returned 404 or network error. Falling back directly to client-side Gemini generation.", err);
  }

  // Client-side fallback
  const effectiveKey = getEffectiveApiKey(apiKey);
  if (!effectiveKey) {
    // Helpful immediate advice from AI chef assistant without crashing
    const lower = message.toLowerCase();
    if (lower.includes("代用") || lower.includes("ない")) {
      return "食材の代用についてですね！例えば、みりんがない場合は【砂糖＋酒（1:3）】、生クリームがない場合は【牛乳＋バター】で代用できます。Google AI Studioで無料のGemini APIキーを設定していただくと、すべての食材に対するより詳しい即答アドバイスが可能です！";
    }
    if (lower.includes("保存") || lower.includes("冷凍") || lower.includes("日持ち")) {
      return "食材の保存についてですね！キャベツや白菜は芯をくり抜いて濡らしたキッチンペーパーを詰めると長持ちします。お肉は小分けにしてラップで密閉し冷凍するのがおすすめです。画面右上の『🔑 APIキー設定』にGemini APIキーを保存していただくと、AIシェフが個別の食材ごとに最適な保存期間と解凍のコツをお答えします！";
    }
    return `ご質問ありがとうございます！「${message}」についてですね。手持ちの食材に合わせて美味しく調理するポイントは、火加減と調味料を入れるタイミングです。画面右上の『🔑 APIキー設定』からGoogle AI Studioの無料キーを設定していただくと、プロの料理人レベルの詳しい解説とアレンジ提案がリアルタイムで受け取れます！`;
  }

  const ai = new GoogleGenAI({ apiKey: effectiveKey });

  let contextPrompt = `あなたは親切で温かいプロの料理研究家・AIシェフです。
ユーザーからの料理、食材の代用、保存方法、下処理、味付けの調整、献立の相談などに親身に答えてください。
回答は分かりやすく、家庭ですぐに実践できる具体的なアドバイスを含めてください。`;

  if (currentMealPlan) {
    contextPrompt += `\n\n【現在表示されている献立プラン】
タイトル: ${currentMealPlan.title}
レシピ一覧:
${currentMealPlan.recipes
  .map(
    (r) =>
      `- ${r.title} (${r.mealType}): 材料 [${r.ingredients.map((i) => `${i.name}(${i.quantity})`).join(", ")}]`
  )
  .join("\n")}`;
  }

  const contents = [
    ...history.map((h) => ({
      role: h.role,
      parts: [{ text: h.parts }],
    })),
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];

  const candidateModels = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];
  for (const model of candidateModels) {
    try {
      const resp = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: contextPrompt,
        },
      });
      if (resp && resp.text) {
        return resp.text;
      }
    } catch (e) {
      console.warn(`Chat model [${model}] failed:`, e);
    }
  }

  // REST fallback for chat with AQ keys
  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(effectiveKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": effectiveKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: contextPrompt }],
          },
          contents: contents.map((c) => ({
            role: c.role === "user" ? "user" : "model",
            parts: [{ text: typeof c.parts === "string" ? c.parts : c.parts[0]?.text || "" }],
          })),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn(`REST chat fallback failed for ${model}:`, e);
    }
  }

  throw new Error("AIシェフからの応答取得に失敗しました。もう一度お試しください。");
}
