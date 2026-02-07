import { Request, Response } from "express";

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
