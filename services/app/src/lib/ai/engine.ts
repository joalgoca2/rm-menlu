import type { AiEngineResponse, AiChatMessage, AiProviderType } from "@/types";
import { buildSystemPrompt, type UserContextForAi } from "./knowledge";
import { processGuidedBotResponse } from "./guided-bot";

export async function processAiMessage(
  userMessage: string,
  userContext: UserContextForAi,
  history: AiChatMessage[] = []
): Promise<AiEngineResponse> {
  const rawProvider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const provider = (rawProvider === "guided" ? "guided" : rawProvider) as AiProviderType;
  const apiKey = process.env.AI_API_KEY;

  const systemPrompt = buildSystemPrompt(userContext);
  const isGenerativeAllowed = userContext.hasAiAgentAccess !== false;

  // Generative Provider 1: OpenAI
  if (isGenerativeAllowed && provider === "openai" && apiKey) {
    try {
      const messages = [
        { role: "system", content: systemPrompt },
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: userMessage },
      ];

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "gpt-4o-mini",
          messages,
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { total_tokens?: number };
        };
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return {
            message: content,
            provider: "openai",
            tokensUsed: data.usage?.total_tokens,
          };
        }
      }
    } catch (_err: unknown) {
      // Fall back gracefully to guided bot if API call fails
    }
  }

  // Generative Provider 2: Google Gemini
  if (isGenerativeAllowed && provider === "gemini" && apiKey) {
    try {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `gemini-1.5-flash:generateContent?key=${apiKey}`;

      const contents = [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...history.map((h) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: userMessage }] },
      ];

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { message: text, provider: "gemini" };
        }
      }
    } catch (_err: unknown) {
      // Fall back gracefully to guided bot if API call fails
    }
  }

  // Deterministic Decision-Tree Guided Menu Bot (Default / Mock)
  let guidedText = processGuidedBotResponse(userMessage, userContext);

  if (!isGenerativeAllowed && (provider === "openai" || provider === "gemini")) {
    const lang = (userContext.locale || "es").toLowerCase();
    const plan = userContext.planName || "Free";
    let notice =
      `\n\n*🚀 Nota: Tu plan actual (${plan}) incluye el Bot Guiado. ` +
      `Actualiza tu suscripción al plan Pro para habilitar el Agente IA Generativo en lenguaje natural.*`;

    if (lang.startsWith("en")) {
      notice =
        `\n\n*🚀 Note: Your active plan (${plan}) includes the Guided Bot. ` +
        `Upgrade to Pro to enable the Generative AI Agent with natural language.*`;
    } else if (lang.startsWith("pt")) {
      notice =
        `\n\n*🚀 Nota: Seu plano atual (${plan}) inclui o Bot Guiado. ` +
        `Atualize para o plano Pro para ativar o Agente IA Generativo com linguagem natural.*`;
    }

    guidedText += notice;
  }

  return {
    message: guidedText,
    provider: provider === "guided" ? "guided" : "mock",
  };
}
