import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { MarrowClient } from "@marrow/client";
import { z } from "zod";

const apiKey =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is required.");
  process.exit(1);
}

const registryUrl =
  process.env.CONVEX_URL || "https://jovial-ibis-732.convex.cloud";
const port = parseInt(process.env.PORT || "3000", 10);

const marrow = new MarrowClient({
  geminiKey: apiKey,
  registryUrl: registryUrl,
});

const app = express();

app.use(express.json());

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];
app.use(
  cors({
    origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
  })
);

const rateLimitMax = parseInt(process.env.RATE_LIMIT || "100", 10);
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded. Please try again later." },
});
app.use(limiter);

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Marrow HTTP API",
    version: "1.0.0",
    description: "REST API wrapper around the Marrow registry",
    endpoints: {
      "GET /health": "Health check",
      "GET /v1/map": "Get page structure map (cache-first)",
      "POST /v1/validate": "Test if selectors work on a page",
      "POST /v1/extract": "Extract content using selectors",
      "GET /v1/manifest": "Get domain manifest",
      "GET /v1/stats": "Registry statistics",
    },
    documentation: "https://github.com/tomiwa-a/marrow",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
  });
});

const getMapSchema = z.object({
  url: z.string().min(1, "URL is required"),
  debug: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

app.get("/v1/map", async (req: Request, res: Response) => {
  try {
    const parsed = getMapSchema.parse(req.query);
    const { url, debug } = parsed;

    const result = debug
      ? await marrow.getMapDetailed(url)
      : await marrow.getMap(url).then((map) => (map ? { map } : null));

    if (!result?.map) {
      return res.status(404).json({ error: "Map not found" });
    }

    return res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: error.message });
  }
});

const validateSchema = z.object({
  url: z.string().url("Invalid URL"),
  selectors: z.array(z.string()).min(1, "At least one selector is required"),
});

app.post("/v1/validate", async (req: Request, res: Response) => {
  try {
    const { url, selectors } = validateSchema.parse(req.body);

    const { data } = await marrow.extractContentDetailed(url, selectors);

    const results = selectors.map((selector) => ({
      selector,
      found: data[selector] !== null,
      value: data[selector],
    }));

    const valid = results.every((r) => r.found);

    return res.json({ valid, results });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: error.message });
  }
});

const extractSchema = z
  .object({
    url: z.string().url("Invalid URL"),
    selectors: z.array(z.string()).optional(),
    elementNames: z.array(z.string()).optional(),
    debug: z.boolean().optional(),
  })
  .refine((data) => data.selectors || data.elementNames, {
    message: "Either selectors or elementNames must be provided",
  });

app.post("/v1/extract", async (req: Request, res: Response) => {
  try {
    const { url, selectors, elementNames, debug } = extractSchema.parse(
      req.body
    );

    let finalSelectors = selectors || [];

    if (elementNames) {
      const map = await marrow.getMap(url);
      if (!map) {
        return res
          .status(404)
          .json({ error: "Map not found for elementNames" });
      }

      const elements = map.elements.filter((el) =>
        elementNames.includes(el.name)
      );
      finalSelectors = elements.flatMap((el) =>
        el.strategies.map((s) => s.value)
      );

      if (finalSelectors.length === 0) {
        return res
          .status(404)
          .json({ error: "No matching elementNames in map" });
      }
    }

    const result = debug
      ? await marrow.extractContentDetailed(url, finalSelectors)
      : await marrow
          .extractContent(url, finalSelectors)
          .then((data) => ({ data }));

    return res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: error.message });
  }
});

const manifestSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
});

app.get("/v1/manifest", async (req: Request, res: Response) => {
  try {
    const { domain } = manifestSchema.parse(req.query);
    const manifest = await marrow.getManifest(domain);
    return res.json(manifest);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: error.message });
  }
});

app.get("/v1/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await marrow.getStats();
    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`[Marrow API] Server running on http://localhost:${port}`);
  console.log(`[Marrow API] Registry: ${registryUrl}`);
});
