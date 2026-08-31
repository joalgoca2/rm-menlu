export type AiRole = "user" | "assistant" | "system";
export type AiProviderType = "mock" | "guided" | "gemini" | "openai" | "anthropic";


export interface AiChatMessage {
  id: string;
  role: AiRole;
  content: string;
  createdAt: string;
}

export interface SendAiMessageInput {
  message: string;
  contextPath?: string;
  history?: {
    role: AiRole;
    content: string;
  }[];
}

export interface AiEngineResponse {
  message: string;
  provider: AiProviderType;
  tokensUsed?: number;
}
