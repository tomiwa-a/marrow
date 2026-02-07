"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarrowClient = void 0;
const browser_1 = require("convex/browser");
const cartographer_1 = require("@marrow/cartographer");
const mapper_1 = require("@marrow/mapper");
class MarrowClient {
    registry;
    mapper;
    constructor(config) {
        this.registry = new browser_1.ConvexHttpClient(config.registryUrl);
        this.mapper = new mapper_1.Mapper(config.geminiKey);
    }
    async getMap(urlPattern) {
        const result = await this.getMapDetailed(urlPattern);
        return result?.map || null;
    }
    async mapPageFresh(urlPattern) {
        const result = await this.mapPageFreshDetailed(urlPattern);
        return result.map;
    }
    async getMapDetailed(urlPattern) {
        const start = Date.now();
        let t = Date.now();
        const cached = await this.registry.query("maps:getMap", {
            urlPattern,
        });
        const queryMs = Date.now() - t;
        if (cached) {
            console.error("✓ Cache hit");
            this.registry
                .mutation("maps:trackView", { urlPattern })
                .catch(() => { });
            return {
                map: cached,
                debug: {
                    cacheHit: true,
                    timingsMs: {
                        query: queryMs,
                        total: Date.now() - start,
                    },
                },
            };
        }
        console.error("✗ Cache miss - mapping locally...");
        const { map, snapshotDebug, timingsMs } = await this.mapLocallyDetailed(urlPattern);
        t = Date.now();
        await this.registry.mutation("maps:saveMap", {
            url: urlPattern,
            domain: map.domain,
            page_type: map.page_type,
            elements: map.elements,
        });
        const saveMs = Date.now() - t;
        console.error("✓ Uploaded to registry");
        return {
            map,
            debug: {
                cacheHit: false,
                timingsMs: {
                    query: queryMs,
                    snapshot: timingsMs.snapshot,
                    model: timingsMs.model,
                    save: saveMs,
                    total: Date.now() - start,
                },
                snapshotDebug,
            },
        };
    }
    async mapPageFreshDetailed(urlPattern) {
        const start = Date.now();
        const { map, snapshotDebug, timingsMs } = await this.mapLocallyDetailed(urlPattern);
        const t = Date.now();
        await this.registry.mutation("maps:saveMap", {
            url: urlPattern,
            domain: map.domain,
            page_type: map.page_type,
            elements: map.elements,
        });
        const saveMs = Date.now() - t;
        return {
            map,
            debug: {
                cacheHit: false,
                forcedRefresh: true,
                timingsMs: {
                    query: 0,
                    snapshot: timingsMs.snapshot,
                    model: timingsMs.model,
                    save: saveMs,
                    total: Date.now() - start,
                },
                snapshotDebug,
            },
        };
    }
    async getElement(urlPattern, elementName) {
        return await this.registry.query("maps:getElement", {
            urlPattern,
            elementName,
        });
    }
    async getManifest(domain) {
        return await this.registry.query("maps:getManifest", { domain });
    }
    async getStats() {
        return await this.registry.query("maps:getStats");
    }
    async mapLocally(urlPattern) {
        const fullUrl = urlPattern.startsWith("http")
            ? urlPattern
            : `https://${urlPattern}`;
        const snapshot = await cartographer_1.Cartographer.snap(fullUrl);
        const result = await this.mapper.analyze(fullUrl, snapshot);
        return result;
    }
    async mapLocallyDetailed(urlPattern) {
        const fullUrl = urlPattern.startsWith("http")
            ? urlPattern
            : `https://${urlPattern}`;
        const snapshotStart = Date.now();
        const { snapshot, debug } = await cartographer_1.Cartographer.snapDetailed(fullUrl);
        const snapshotMs = Date.now() - snapshotStart;
        const modelStart = Date.now();
        const result = await this.mapper.analyze(fullUrl, snapshot);
        const modelMs = Date.now() - modelStart;
        return {
            map: result,
            snapshotDebug: debug,
            timingsMs: {
                snapshot: snapshotMs,
                model: modelMs,
            },
        };
    }
    async extractContent(url, selectors) {
        const { data } = await this.extractContentDetailed(url, selectors);
        return data;
    }
    async extractContentDetailed(url, selectors) {
        const fullUrl = url.startsWith("http") ? url : `https://${url}`;
        const start = Date.now();
        const { data, debug } = await cartographer_1.Cartographer.extractDetailed(fullUrl, selectors);
        return {
            data,
            debug: {
                timingsMs: {
                    total: Date.now() - start,
                },
                cartographer: debug,
            },
        };
    }
}
exports.MarrowClient = MarrowClient;
