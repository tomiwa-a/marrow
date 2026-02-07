"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mapper = exports.PageSchema = void 0;
const client_1 = require("./client");
const schema_1 = require("@marrow/schema");
Object.defineProperty(exports, "PageSchema", { enumerable: true, get: function () { return schema_1.PageSchema; } });
const discovery_1 = require("./prompts/discovery");
class Mapper {
    client;
    constructor(apiKey) {
        this.client = new client_1.MapperClient(apiKey);
    }
    async analyze(url, snapshot) {
        const prompt = (0, discovery_1.buildDiscoveryPrompt)(url, snapshot.html, snapshot.axeSummary);
        return await this.client.generate(prompt, schema_1.PageSchema);
    }
}
exports.Mapper = Mapper;
