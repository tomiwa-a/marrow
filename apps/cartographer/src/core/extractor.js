"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextExtractor = void 0;
const playwright_1 = require("@axe-core/playwright");
class ContextExtractor {
    async getAXTree(page) {
        if (!page) {
            throw new Error("Page is undefined");
        }
        const results = await new playwright_1.AxeBuilder({ page })
            .include('body')
            .analyze();
        return results;
    }
    async getCleanHTML(page) {
        return await page.content();
    }
}
exports.ContextExtractor = ContextExtractor;
