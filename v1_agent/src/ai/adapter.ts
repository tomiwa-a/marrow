import { AIProvider, AIProviderType } from "./types";
import { OllamaProvider } from "./providers/ollama";
import { GeminiProvider } from "./providers/gemini";

export class AIAdapter {
  private visionProvider: AIProvider;
  private reasoningProvider: AIProvider;

  constructor(
    visionProvider: AIProviderType = "gemini",
    reasoningProvider: AIProviderType = "ollama",
  ) {
    this.visionProvider = this.createProvider(visionProvider);
    this.reasoningProvider = this.createProvider(reasoningProvider);
  }

  private createProvider(type: AIProviderType): AIProvider {
    switch (type) {
      case "ollama":
        return new OllamaProvider(
          process.env.OLLAMA_URL,
          process.env.OLLAMA_MODEL,
        );
      case "gemini":
        return new GeminiProvider(
          process.env.GEMINI_API_KEY,
          process.env.GEMINI_MODEL,
        );
      case "openai":
        throw new Error("OpenAI provider not implemented yet");
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  async chat(prompt: string): Promise<string> {
    return this.reasoningProvider.chat([{ role: "user", content: prompt }]);
  }

  async chatWithImage(prompt: string, imageBase64: string): Promise<string> {
    return this.visionProvider.chatWithImage(prompt, imageBase64);
  }
}
