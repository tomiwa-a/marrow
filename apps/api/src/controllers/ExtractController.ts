import { Request, Response } from "express";
import { Cartographer } from "@marrow/cartographer";
import { z } from "zod";

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
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }
}
