import { Request, Response } from "express";
import { Cartographer } from "@marrow/cartographer";
import { z } from "zod";

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
