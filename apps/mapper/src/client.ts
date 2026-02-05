
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import dotenv from 'dotenv';
import path from 'path';

// specific loader for monorepo root .env if not already loaded
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export class MapperClient {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string = process.env.GEMINI_API_KEY || "") {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required. Set it in .env");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = "gemini-2.0-flash-exp"; // Using experimental 2.0 flash for structured outputs
  }

  /**
   * Generates structured JSON based on the provided Zod schema.
   * @param prompt The prompt to send to the AI.
   * @param schema The Zod schema to enforce on the output.
   * @returns The parsed JSON object matching the schema.
   */
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
      // Optional: Double-check validation with Zod
      return schema.parse(json);
    } catch (error) {
      console.error("Failed to parse or validate JSON response:", responseText);
      throw new Error(`AI response invalid: ${error}`);
    }
  }

  /**
   * Helper to convert Zod schema to the JSON Schema format expected by Gemini.
   * Note: Gemini expects a slightly simplified JSON schema (OpenAPI compatible).
   * We use zod-to-json-schema and casting for now.
   */
  private convertZodToGeminiSchema(schema: z.ZodType<any>): any {
    const jsonSchema = zodToJsonSchema(schema as any, { target: "openApi3" });
    // Remove the $schema and other fields if necessary, or pass strictly.
    // Gemini 2.0 is generally robust with standard JSON schemas.
    return jsonSchema;
  }
}
