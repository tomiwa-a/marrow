import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, AIMessage } from "../types";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: string;
  private debug: boolean;

  constructor(
    apiKey: string = process.env.GEMINI_API_KEY || "",
    model: string = "gemini-2.5-flash",
  ) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
    this.debug = process.env.DEBUG_AI === "true";
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
    const model = this.client.getGenerativeModel({ model: this.model });

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      throw new Error("Last message must be from user");
    }

    this.logDebug("Gemini chat request", {
      model: this.model,
      messageCount: messages.length,
      lastMessageLength: lastMessage.content.length,
    });

    try {
      const result = await model.generateContent(lastMessage.content);
      const response = result.response;
      const text = response.text();

      this.logDebug("Gemini chat response", {
        model: this.model,
        length: text.length,
      });

      return text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini request failed: ${error.message}`);
      }
      throw error;
    }
  }

  async chatWithImage(prompt: string, imageBase64: string): Promise<string> {
    const model = this.client.getGenerativeModel({ model: this.model });

    this.logDebug("Gemini vision request", {
      model: this.model,
      promptLength: prompt.length,
      imageBytes: Math.floor(imageBase64.length * 0.75),
    });

    try {
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        },
        prompt,
      ]);

      const response = result.response;
      const text = response.text();

      this.logDebug("Gemini vision response", {
        model: this.model,
        length: text.length,
      });

      return text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini request failed: ${error.message}`);
      }
      throw error;
    }
  }
}
