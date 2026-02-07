"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapperClient = void 0;
const google_1 = require("@ai-sdk/google");
const ai_1 = require("ai");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
class MapperClient {
    modelName;
    constructor(apiKey = process.env.GEMINI_API_KEY || "") {
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is required. Set it in .env");
        }
        // The AI SDK looks for this specific env var
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
        this.modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    }
    async generate(prompt, schema) {
        const { object } = await (0, ai_1.generateObject)({
            model: (0, google_1.google)(this.modelName),
            schema: schema,
            prompt: prompt,
        });
        return object;
    }
}
exports.MapperClient = MapperClient;
