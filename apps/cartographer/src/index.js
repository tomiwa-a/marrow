"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cartographer = void 0;
const navigator_1 = require("./core/navigator");
const extractor_1 = require("./core/extractor");
class Cartographer {
    static async snap(url, headless = true) {
        const { snapshot } = await this.snapDetailed(url, headless);
        return snapshot;
    }
    static async snapDetailed(url, headless = true) {
        const navigator = new navigator_1.Navigator();
        const extractor = new extractor_1.ContextExtractor();
        const start = Date.now();
        const timings = {
            init: 0,
            goto: 0,
            html: 0,
            axe: 0,
            total: 0,
        };
        try {
            let t = Date.now();
            await navigator.init(headless);
            timings.init = Date.now() - t;
            t = Date.now();
            await navigator.goto(url);
            timings.goto = Date.now() - t;
            t = Date.now();
            const html = await extractor.getCleanHTML(navigator.page);
            timings.html = Date.now() - t;
            t = Date.now();
            const axTree = await extractor.getAXTree(navigator.page);
            timings.axe = Date.now() - t;
            const axeSummary = JSON.stringify({
                violations: axTree.violations.slice(0, 3),
                passes: axTree.passes.length,
                incomplete: axTree.incomplete.length,
            }, null, 2);
            timings.total = Date.now() - start;
            return {
                snapshot: {
                    html: html.slice(0, 15000),
                    axeSummary,
                },
                debug: {
                    timingsMs: timings,
                    finalUrl: navigator.page?.url() || url,
                    htmlLength: html.length,
                    axeCounts: {
                        violations: axTree.violations.length,
                        passes: axTree.passes.length,
                        incomplete: axTree.incomplete.length,
                    },
                },
            };
        }
        finally {
            await navigator.close();
        }
    }
    static async extract(url, selectors, headless = true) {
        const { data } = await this.extractDetailed(url, selectors, headless);
        return data;
    }
    static async extractDetailed(url, selectors, headless = true) {
        const navigator = new navigator_1.Navigator();
        const start = Date.now();
        const timings = {
            init: 0,
            goto: 0,
            extract: 0,
            total: 0,
        };
        const selectorDebug = [];
        try {
            let t = Date.now();
            await navigator.init(headless);
            timings.init = Date.now() - t;
            t = Date.now();
            await navigator.goto(url);
            timings.goto = Date.now() - t;
            if (!navigator.page)
                throw new Error("Page not initialized");
            const results = {};
            t = Date.now();
            for (const selector of selectors) {
                try {
                    const content = await navigator.page.evaluate((sel) => {
                        const el = document.querySelector(sel);
                        return el ? el.innerText.trim() : null;
                    }, selector);
                    results[selector] = content;
                    selectorDebug.push({
                        selector,
                        found: content !== null,
                        textLength: content ? content.length : 0,
                    });
                }
                catch (e) {
                    console.error(`Failed to extract selector: ${selector}`, e);
                    results[selector] = null;
                    selectorDebug.push({
                        selector,
                        found: false,
                        textLength: 0,
                        error: e?.message || "Unknown error",
                    });
                }
            }
            timings.extract = Date.now() - t;
            timings.total = Date.now() - start;
            return {
                data: results,
                debug: {
                    timingsMs: timings,
                    finalUrl: navigator.page.url(),
                    selectors: selectorDebug,
                },
            };
        }
        finally {
            await navigator.close();
        }
    }
}
exports.Cartographer = Cartographer;
