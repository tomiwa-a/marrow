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

  constructor(baseUrl: string = "http://localhost:11434", model: string = "llama3.2-vision") {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async chat(messages: AIMessage[]): Promise<string> {
    const ollamaMessages: OllamaMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await axios.post<OllamaResponse>(
        `${this.baseUrl}/api/chat`,
        {
          model: this.model,
          messages: ollamaMessages,
          stream: false,
        },
        {
          timeout: 60000,
        }
      );

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

    try {
      const response = await axios.post<OllamaResponse>(
        `${this.baseUrl}/api/chat`,
        {
          model: this.model,
          messages,
          stream: false,
        },
        {
          timeout: 60000,
        }
      );

      return response.data.message.content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Ollama request failed: ${error.message}`);
      }
      throw error;
    }
  }
}
