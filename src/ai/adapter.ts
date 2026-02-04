import { AIProvider, AIProviderType } from "./types";
import { OllamaProvider } from "./providers/ollama";

export class AIAdapter {
  private provider: AIProvider;

  constructor(providerType: AIProviderType = "ollama") {
    this.provider = this.createProvider(providerType);
  }

  private createProvider(type: AIProviderType): AIProvider {
    switch (type) {
      case "ollama":
        return new OllamaProvider(
          process.env.OLLAMA_URL,
          process.env.OLLAMA_MODEL
        );
      case "gemini":
        throw new Error("Gemini provider not implemented yet");
      case "openai":
        throw new Error("OpenAI provider not implemented yet");
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  async chat(prompt: string): Promise<string> {
    return this.provider.chat([{ role: "user", content: prompt }]);
  }

  async chatWithImage(prompt: string, imageBase64: string): Promise<string> {
    return this.provider.chatWithImage(prompt, imageBase64);
  }
}
