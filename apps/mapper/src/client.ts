import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export class MapperClient {
  private modelName: string;

  constructor(apiKey: string = process.env.GEMINI_API_KEY || "") {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required. Set it in .env");
    }
    // The AI SDK looks for this specific env var
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  }

  async generate<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    const { object } = await generateObject({
      model: google(this.modelName),
      schema: schema,
      prompt: prompt,
    });

    return object;
  }
}
