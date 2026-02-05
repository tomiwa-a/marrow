import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MarrowClient } from "@marrow/client";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is required.");
  process.exit(1);
}

const registryUrl = process.env.CONVEX_URL || "https://jovial-ibis-732.convex.cloud";

const marrow = new MarrowClient({
  geminiKey: apiKey,
  registryUrl: registryUrl,
});

const server = new Server({
  name: "marrow-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

server.setRequestHandler(
  z.object({
    method: z.literal("tools/list"),
  }).passthrough(),
  async () => ({
    tools: [
      {
        name: "get_page_map",
        description: "Get the semantic map of a website. Use this to understand the page structure, find buttons, inputs, and data containers.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
          },
          required: ["url"],
        },
      },
      {
        name: "map_page",
        description: "Trigger a fresh map for a page (use if get_page_map returns nothing).",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
          },
          required: ["url"],
        },
      },
    ],
  })
);

server.setRequestHandler(
  z.object({
    method: z.literal("tools/call"),
    params: z.object({
      name: z.string(),
      arguments: z.record(z.unknown()),
    }),
  }).passthrough(),
  async (request) => {
    switch (request.params.name) {
      case "get_page_map": {
        const url = String(request.params.arguments?.url);
        try {
          console.error(`[Marrow] Requesting map for: ${url}`);
          const map = await marrow.getMap(url);
          if (!map) {
             return {
               content: [{ type: "text", text: "Map not found. Try map_page(url)." }],
               isError: true,
             };
          }
          return {
            content: [{ type: "text", text: JSON.stringify(map, null, 2) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }

      case "map_page": {
        const url = String(request.params.arguments?.url);
        try {
           console.error(`[Marrow] Mapping page: ${url}`);
           const map = await marrow.getMap(url);
           return {
             content: [{ type: "text", text: JSON.stringify(map, null, 2) }],
           };
        } catch (error: any) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }

      default:
        throw new Error("Unknown tool");
    }
  }
);

// Start Server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[Marrow] MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
