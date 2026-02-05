
import { GoogleGenerativeAI, GenerativeModel, SchemaType } from "@google/generative-ai";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface LLMResponse {
  toolCalls?: { name: string; args: any }[];
  content?: string;
}

export class LLMClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey?: string, modelId: string = "gemini-2.5-flash") {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({ model: modelId });
  }

  async chat(
    systemPrompt: string,
    userMessage: string,
    tools: ToolDefinition[] = []
  ): Promise<LLMResponse> {
    const geminiTools = tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: t.parameters.properties,
        required: t.parameters.required,
      },
    }));

    const sessionModel = this.genAI.getGenerativeModel({
      model: this.model.model,
      systemInstruction: systemPrompt,
      tools: tools.length > 0 ? [{ functionDeclarations: geminiTools }] : undefined,
    });

    const chat = sessionModel.startChat({
      history: [],
    });

    try {
      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      const functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        return {
          toolCalls: functionCalls.map((fc) => ({
            name: fc.name,
            args: fc.args,
          })),
        };
      }

      return {
        content: response.text(),
      };
    } catch (error) {
      console.error("LLM Error:", error);
      throw error;
    }
  }
}
