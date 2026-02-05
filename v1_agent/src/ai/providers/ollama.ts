import axios from "axios";
import { AIProvider, AIMessage } from "../types";

interface OllamaMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
}

interface OllamaResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
}

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;
  private debug: boolean;
  private timeoutMs: number;

  constructor(
    baseUrl: string = "http://localhost:11434",
    model: string = "llama3.2-vision:11b-instruct-q4_K_M",
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
    this.debug = process.env.DEBUG_AI === "true";
    this.timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS) || 180000;
  }

  private logDebug(message: string, data?: Record<string, unknown>) {
    if (!this.debug) return;
    if (data) {
      console.log(`[AI DEBUG] ${message}`, data);
    } else {
      console.log(`[AI DEBUG] ${message}`);
    }
  }

  async chat(messages: AIMessage[]): Promise<string> {
    const ollamaMessages: OllamaMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    this.logDebug("Ollama chat request", {
      model: this.model,
      baseUrl: this.baseUrl,
      messages: ollamaMessages.map((m) => ({
        role: m.role,
        length: m.content.length,
      })),
    });

    try {
      const response = await axios.post<OllamaResponse>(
        `${this.baseUrl}/api/chat`,
        {
          model: this.model,
          messages: ollamaMessages,
          stream: false,
        },
        {
          timeout: this.timeoutMs,
        },
      );

      this.logDebug("Ollama chat response", {
        model: response.data.model,
        length: response.data.message.content.length,
      });

      return response.data.message.content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ollama request failed: ${error.message}`);
      }
      throw error;
    }
  }

  async chatWithImage(prompt: string, imageBase64: string): Promise<string> {
    const messages: OllamaMessage[] = [
      {
        role: "user",
        content: prompt,
        images: [imageBase64],
      },
    ];

    this.logDebug("Ollama vision request", {
      model: this.model,
      baseUrl: this.baseUrl,
      promptLength: prompt.length,
      imageBytes: Math.floor(imageBase64.length * 0.75),
    });

    try {
      const response = await axios.post<OllamaResponse>(
        `${this.baseUrl}/api/chat`,
        {
          model: this.model,
          messages,
          stream: false,
        },
        {
          timeout: this.timeoutMs,
        },
      );

      this.logDebug("Ollama vision response", {
        model: response.data.model,
        length: response.data.message.content.length,
      });

      return response.data.message.content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ollama request failed: ${error.message}`);
      }
      throw error;
    }
  }
}
