import { Request, Response } from "express";
import { Cartographer } from "@marrow/cartographer";
import { z } from "zod";

export class HealthController {
  health(_req: Request, res: Response): Response {
    return res.json({
      status: "ok",
      timestamp: Date.now(),
    });
  }

  info(_req: Request, res: Response): Response {
    return res.json({
      name: "Marrow HTTP API",
      version: "1.0.0",
      description: "REST API for web scraping with BYOK (Bring Your Own Key)",
      endpoints: {
        "GET /health": "Health check",
        "POST /v1/validate": "Test if selectors work on a page",
        "POST /v1/extract": "Extract content using selectors",
      },
      documentation: "https://github.com/tomiwa-a/marrow",
    });
  }
}

const validateSchema = z.object({
  url: z.string().url("Invalid URL"),
  selectors: z.array(z.string()).min(1, "At least one selector is required"),
});

export class ValidateController {
  async validate(req: Request, res: Response): Promise<Response> {
    try {
      const { url, selectors } = validateSchema.parse(req.body);

      const { data } = await Cartographer.extractDetailed(url, selectors);

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
  }
}

const extractSchema = z.object({
  url: z.string().url("Invalid URL"),
  selectors: z.array(z.string()).min(1, "At least one selector is required"),
  debug: z.boolean().optional(),
});

export class ExtractController {
  async extract(req: Request, res: Response): Promise<Response> {
    try {
      const { url, selectors, debug } = extractSchema.parse(req.body);

      const result = debug
        ? await Cartographer.extractDetailed(url, selectors)
        : await Cartographer.extract(url, selectors).then((data) => ({ data }));

      return res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: error.message });
    }
  }
}
