import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export class MapperClient {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string = process.env.GEMINI_API_KEY || "") {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required. Set it in .env");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = "gemini-2.0-flash-exp";
  }

  async generate<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: this.convertZodToGeminiSchema(schema),
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
      const json = JSON.parse(responseText);
      return schema.parse(json);
    } catch (error) {
      console.error("Failed to parse or validate JSON response:", responseText);
      throw new Error(`AI response invalid: ${error}`);
    }
  }

  private convertZodToGeminiSchema(schema: z.ZodType<any>): any {
    return zodToJsonSchema(schema as any, { target: "openApi3" });
  }
}
