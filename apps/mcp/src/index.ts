console.log = console.error;

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

const marrow = new MarrowClient({
  geminiKey: apiKey,
  registryUrl: registryUrl,
});

const server = new Server(
  {
    name: "marrow-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(
  z
    .object({
      method: z.literal("tools/list"),
    })
    .passthrough(),
  async () => ({
    tools: [
      {
        name: "get_page_map",
        description:
          "Get the semantic map of a website. Use this to understand the page structure and find selectors.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
            debug: {
              type: "boolean",
              description:
                "Include timing and cache diagnostics in the response.",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "map_page",
        description:
          "Trigger a fresh map for a page (use if get_page_map returns nothing).",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
            debug: {
              type: "boolean",
              description:
                "Include timing and cache diagnostics in the response.",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "extract_content",
        description:
          "Extract text content from specific elements on a page using selectors found via get_page_map.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
            selectors: {
              type: "array",
              items: { type: "string" },
              description: "List of CSS selectors to extract content from.",
            },
            elementNames: {
              type: "array",
              items: { type: "string" },
              description:
                "Optional element names from the map. If provided, selectors are derived from map strategies.",
            },
            debug: {
              type: "boolean",
              description:
                "Include timing and selector diagnostics in the response.",
            },
            retry: {
              type: "object",
              properties: {
                maxAttempts: { type: "number" },
                useMapSelectors: { type: "boolean" },
              },
              required: [],
            },
          },
          required: ["url"],
        },
      },
    ],
  }),
);

server.setRequestHandler(
  z
    .object({
      method: z.literal("tools/call"),
      params: z.object({
        name: z.string(),
        arguments: z.record(z.unknown()),
      }),
    })
    .passthrough(),
  async (request) => {
    switch (request.params.name) {
      case "get_page_map": {
        const url = String(request.params.arguments?.url);
        const debug = Boolean(request.params.arguments?.debug);
        try {
          console.error(`[Marrow] Requesting map for: ${url}`);
          const result = debug
            ? await marrow.getMapDetailed(url)
            : await marrow.getMap(url).then((map) => (map ? { map } : null));
          if (!result?.map) {
            return {
              content: [
                { type: "text", text: "Map not found. Try map_page(url)." },
              ],
              isError: true,
            };
          }
          const payload = debug ? result : result.map;
          const jsonString = JSON.stringify(payload, null, 2);
          const cleanJson = jsonString.replace(/[^\x20-\x7E]/g, "");

          return {
            content: [{ type: "text", text: cleanJson }],
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
        const debug = Boolean(request.params.arguments?.debug);
        try {
          console.error(`[Marrow] Mapping page: ${url}`);
          const result = debug
            ? await marrow.getMapDetailed(url)
            : await marrow.getMap(url).then((map) => (map ? { map } : null));
          if (!result?.map) {
            return {
              content: [
                {
                  type: "text",
                  text: "Map not found. Try again or verify the URL.",
                },
              ],
              isError: true,
            };
          }
          const payload = debug ? result : result.map;
          const jsonString = JSON.stringify(payload, null, 2);
          const cleanJson = jsonString.replace(/[^\x20-\x7E]/g, "");
          return {
            content: [{ type: "text", text: cleanJson }],
          };
        } catch (error: any) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }

      case "extract_content": {
        const url = String(request.params.arguments?.url);
        const selectors = request.params.arguments?.selectors as
          | string[]
          | undefined;
        const elementNames = request.params.arguments?.elementNames as
          | string[]
          | undefined;
        const debug = Boolean(request.params.arguments?.debug);
        const retry = request.params.arguments?.retry as
          | { maxAttempts?: number; useMapSelectors?: boolean }
          | undefined;

        try {
          if (
            (!selectors || selectors.length === 0) &&
            (!elementNames || elementNames.length === 0)
          ) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Provide selectors or elementNames.",
                },
              ],
              isError: true,
            };
          }

          const maxAttempts = Math.max(1, Math.floor(retry?.maxAttempts || 1));
          let selectorPlan: string[] = selectors ? [...selectors] : [];
          let elementPlan: { name: string; selectors: string[] }[] | undefined;
          let fallbackSelectors: string[] = [];
          let fallbackApplied = false;

          if (elementNames && elementNames.length > 0) {
            const mapResult = debug
              ? await marrow.getMapDetailed(url)
              : await marrow
                  .getMap(url)
                  .then((map) => (map ? { map, debug: undefined } : null));

            if (!mapResult?.map) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: Map not found for elementNames.",
                  },
                ],
                isError: true,
              };
            }

            const elements = mapResult.map.elements.filter((el) =>
              elementNames.includes(el.name),
            );

            const plan = elements.map((el) => {
              const css = el.strategies
                .filter((s) => s.type.toLowerCase().includes("css"))
                .map((s) => s.value);
              const other = el.strategies
                .filter((s) => !s.type.toLowerCase().includes("css"))
                .map((s) => s.value);
              const all = [...css, ...other].filter((value) => Boolean(value));
              const unique = Array.from(new Set(all));
              return { name: el.name, selectors: unique };
            });

            if (plan.length === 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: "Error: No matching elementNames in map.",
                  },
                ],
                isError: true,
              };
            }

            elementPlan = plan;
            selectorPlan = plan.flatMap((p) => p.selectors);
          } else if (retry?.useMapSelectors) {
            const mapResult = debug
              ? await marrow.getMapDetailed(url)
              : await marrow
                  .getMap(url)
                  .then((map) => (map ? { map, debug: undefined } : null));

            if (mapResult?.map) {
              fallbackSelectors = mapResult.map.elements
                .flatMap((el) =>
                  el.strategies
                    .filter((s) => s.type.toLowerCase().includes("css"))
                    .map((s) => s.value),
                )
                .filter((value) => Boolean(value));
            }
          }

          selectorPlan = Array.from(new Set(selectorPlan));
          fallbackSelectors = fallbackSelectors.filter(
            (value) => !selectorPlan.includes(value),
          );

          if (selectorPlan.length === 0) {
            return {
              content: [{ type: "text", text: "Error: No selectors available for extraction." }],
              isError: true,
            };
          }

          console.error(
            `[Marrow] Extracting content from: ${url} (${selectorPlan.length} selectors)`,
          );

          let attempt = 0;
          let data: Record<string, string | null> = {};
          let debugInfo: any = undefined;

          while (attempt < maxAttempts) {
            attempt += 1;
            if (debug) {
              const result = await marrow.extractContentDetailed(
                url,
                selectorPlan,
              );
              data = result.data;
              debugInfo = result.debug;
            } else {
              data = await marrow.extractContent(url, selectorPlan);
            }

            const missing = Object.values(data).some((value) => value === null);
            if (!missing) {
              break;
            }

            if (!fallbackApplied && fallbackSelectors.length > 0) {
              selectorPlan = selectorPlan.concat(fallbackSelectors);
              fallbackApplied = true;
            }
          }

          let response: any = data;

          if (elementPlan) {
            const byElement: Record<string, string | null> = {};
            for (const plan of elementPlan) {
              let resolved: string | null = null;
              for (const selector of plan.selectors) {
                const value = data[selector] ?? null;
                if (value !== null) {
                  resolved = value;
                  break;
                }
              }
              byElement[plan.name] = resolved;
            }
            response = byElement;
          }

          const payload = debug
            ? {
                data: response,
                debug: {
                  attempts: attempt,
                  selectors: selectorPlan,
                  elementNames: elementNames || undefined,
                  fallbackApplied,
                  fallbackSelectorCount: fallbackSelectors.length,
                  extract: debugInfo,
                },
              }
            : response;

          const jsonString = JSON.stringify(payload, null, 2);
          // Sanitize
          const cleanJson = jsonString.replace(/[^\x20-\x7E]/g, "");

          return {
            content: [{ type: "text", text: cleanJson }],
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
  },
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
