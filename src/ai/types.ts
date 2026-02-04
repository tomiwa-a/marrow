export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIProvider {
  chat(messages: AIMessage[]): Promise<string>;
  chatWithImage(prompt: string, imageBase64: string): Promise<string>;
}

export type AIProviderType = "ollama" | "gemini" | "openai";
