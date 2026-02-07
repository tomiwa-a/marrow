import { Request, Response } from "express";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

const getMapSchema = z.object({
  url: z.string().min(1, "URL is required"),
});

const getManifestSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
});

export class RegistryController {
  private convex: ConvexHttpClient;

  constructor(convexUrl: string) {
    this.convex = new ConvexHttpClient(convexUrl);
  }

  async getMap(req: Request, res: Response): Promise<Response> {
    try {
      const { url } = getMapSchema.parse(req.query);
      
      const map = await this.convex.query("maps:getMap" as any, { 
        urlPattern: url 
      });
      
      if (!map) {
        return res.status(404).json({ error: "Map not found" });
      }
      
      return res.json(map);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  async getManifest(req: Request, res: Response): Promise<Response> {
    try {
      const { domain } = getManifestSchema.parse(req.query);
      
      const manifest = await this.convex.query("maps:getManifest" as any, { 
        domain 
      });
      
      return res.json(manifest);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  async getStats(_req: Request, res: Response): Promise<Response> {
    try {
      const stats = await this.convex.query("maps:getStats" as any);
      return res.json(stats);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
