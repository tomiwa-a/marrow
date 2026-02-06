import "dotenv/config";
import { spawn } from "child_process";
import { createInterface } from "readline";
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

type JsonRpcResponse = {
  id: number;
  result?: any;
  error?: { message?: string; code?: number; data?: any };
};

type ToolCall = {
  tool: string;
  args?: Record<string, unknown>;
};

type TaskField = {
  key: string;
  description: string;
};

type Task = {
  url: string;
  fields: TaskField[];
};

class McpStdioClient {
  private cmd: string;
  private child: ReturnType<typeof spawn> | null = null;
  private nextId = 1;
  private pending = new Map<number, (response: JsonRpcResponse) => void>();

  constructor(cmd: string) {
    this.cmd = cmd;
  }

  async start(env: NodeJS.ProcessEnv) {
    if (this.child) return;
    this.child = spawn(this.cmd, {
      shell: true,
      env,
      stdio: ["pipe", "pipe", "inherit"],
    });

    const rl = createInterface({ input: this.child.stdout! });
    rl.on("line", (line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("{")) return;
      try {
        const message = JSON.parse(trimmed) as JsonRpcResponse;
        if (typeof message.id !== "number") return;
        const resolver = this.pending.get(message.id);
        if (resolver) {
          this.pending.delete(message.id);
          resolver(message);
        }
      } catch (err) {
        // Ignore non-JSON lines.
      }
    });
  }

  async request(method: string, params: Record<string, unknown>): Promise<any> {
    if (!this.child || !this.child.stdin) {
      throw new Error("MCP client not started");
    }

    const id = this.nextId++;
    const payload = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    const response = await new Promise<JsonRpcResponse>((resolve) => {
      this.pending.set(id, resolve);
      this.child!.stdin!.write(JSON.stringify(payload) + "\n");
    });

    if (response.error) {
      throw new Error(response.error.message || "MCP request failed");
    }

    return response.result;
  }

  async listTools() {
    return await this.request("tools/list", {});
  }

  async callTool(name: string, args: Record<string, unknown>) {
    return await this.request("tools/call", { name, arguments: args });
  }

  async close() {
    if (!this.child) return;
    this.child.kill();
    this.child = null;
  }
}

function extractFirstJson(text: string): any | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (err) {
    return null;
  }
}

function buildTaskPrompt(task: Task, toolNames: string[], toolResults: string) {
  const fields = task.fields
    .map((field) => `- ${field.key}: ${field.description}`)
    .join("\n");

  return [
    "You are a data extraction agent.",
    "You must return JSON only.",
    'If you need a tool, respond with: {"tool": "tool_name", "args": {...}}',
    'When done, respond with: {"final": { ...fields... }}',
    "Use extract_content to fetch text for the fields whenever possible.",
    "Do not include any extra text.",
    "",
    "Tools available:",
    toolNames.map((name) => `- ${name}`).join("\n"),
    "",
    "Task:",
    `URL: ${task.url}`,
    "Fields:",
    fields,
    "",
    "Tool results so far:",
    toolResults || "(none)",
  ].join("\n");
}

async function callGemini(model: string, apiKey: string, prompt: string) {
  const client = new GoogleGenerativeAI(apiKey);
  const gemini = client.getGenerativeModel({ model });
  const result = await gemini.generateContent(prompt);
  return result.response.text();
}

async function runAgentNoTools(task: Task, model: string, apiKey: string) {
  const prompt = [
    "You are a data extraction agent.",
    "You do NOT have any tools or web access.",
    'If you cannot find a field, return "UNKNOWN".',
    "Return JSON only. No extra text.",
    "",
    `URL: ${task.url}`,
    "Fields:",
    task.fields.map((f) => `- ${f.key}: ${f.description}`).join("\n"),
  ].join("\n");

  const start = Date.now();
  const text = await callGemini(model, apiKey, prompt);
  const durationMs = Date.now() - start;
  const parsed = extractFirstJson(text);
  return {
    durationMs,
    output: parsed || { raw: text },
  };
}

async function runAgentWithMcp(
  task: Task,
  model: string,
  apiKey: string,
  mcp: McpStdioClient,
  runLabel: string,
  searchMcp?: { client: McpStdioClient; toolName: string },
) {
  const toolNames = ["get_manifest", "get_page_map", "extract_content"];
  if (searchMcp) {
    toolNames.push(searchMcp.toolName);
  }
  const toolResults: string[] = [];

  let finalOutput: any = null;
  let cacheHit: boolean | null = null;
  let step = 0;
  let toolUsed = false;
  const start = Date.now();

  const domain = new URL(task.url).hostname.replace(/^www\./, "");
  const manifestResult = await mcp.callTool("get_manifest", { domain });
  const manifestText = manifestResult?.content?.[0]?.text || "";
  const manifestPayload = extractFirstJson(manifestText) || manifestText;
  toolResults.push(
    `Tool get_manifest result: ${
      typeof manifestPayload === "string"
        ? manifestPayload.slice(0, 500)
        : JSON.stringify(manifestPayload).slice(0, 500)
    }`,
  );

  const mapResult = await mcp.callTool("get_page_map", {
    url: task.url,
    debug: true,
  });
  const mapText = mapResult?.content?.[0]?.text || "";
  const mapPayload = extractFirstJson(mapText) || mapText;
  if (mapPayload?.debug) {
    cacheHit = Boolean(mapPayload.debug.cacheHit);
  }
  toolResults.push(
    `Tool get_page_map result: ${
      typeof mapPayload === "string"
        ? mapPayload.slice(0, 500)
        : JSON.stringify(mapPayload).slice(0, 500)
    }`,
  );

  while (step < 8) {
    step += 1;
    const prompt = buildTaskPrompt(task, toolNames, toolResults.join("\n"));
    const response = await callGemini(model, apiKey, prompt);
    const parsed = extractFirstJson(response);

    if (!parsed) {
      finalOutput = { raw: response };
      break;
    }

    if (parsed.final) {
      if (!toolUsed) {
        toolResults.push(
          "Tool use required: call get_page_map then extract_content before final.",
        );
        continue;
      }
      finalOutput = parsed.final;
      break;
    }

    const toolCall = parsed as ToolCall;
    if (!toolCall.tool) {
      finalOutput = parsed;
      break;
    }

    if (!toolNames.includes(toolCall.tool)) {
      toolResults.push(`Tool error: unknown tool ${toolCall.tool}`);
      continue;
    }

    if (toolCall.tool === "get_page_map") {
      toolCall.args = {
        ...(toolCall.args || {}),
        debug: true,
      };
    }

    const client =
      searchMcp && toolCall.tool === searchMcp.toolName
        ? searchMcp.client
        : mcp;
    const result = await client.callTool(toolCall.tool, toolCall.args || {});
    toolUsed = true;
    const text = result?.content?.[0]?.text || "";
    const parsedResult = extractFirstJson(text) || text;

    if (toolCall.tool === "get_page_map" && parsedResult?.debug) {
      cacheHit = Boolean(parsedResult.debug.cacheHit);
    }

    toolResults.push(
      `Tool ${toolCall.tool} result: ${
        typeof parsedResult === "string"
          ? parsedResult.slice(0, 500)
          : JSON.stringify(parsedResult).slice(0, 500)
      }`,
    );
  }

  return {
    runLabel,
    durationMs: Date.now() - start,
    cacheHit,
    output: finalOutput,
  };
}

function scoreOutput(fields: TaskField[], output: Record<string, unknown>) {
  let present = 0;
  const details: Record<string, boolean> = {};
  for (const field of fields) {
    const value = output?.[field.key];
    const ok = Boolean(value) && value !== "UNKNOWN";
    if (ok) present += 1;
    details[field.key] = ok;
  }
  return {
    present,
    total: fields.length,
    details,
  };
}

async function main() {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const mcpCmd = process.env.MARROW_MCP_CMD || "npx tsx apps/mcp/src/index.ts";
  const searchCmd = process.env.SEARCH_MCP_CMD;
  const searchToolName = process.env.SEARCH_TOOL_NAME || "search";

  const tasks: Task[] = [
    {
      url: "https://developer.paypal.com/docs/api/overview/",
      fields: [
        { key: "page_title", description: "Document <title> text" },
        { key: "h1_text", description: "Main H1 heading" },
        {
          key: "primary_nav_labels",
          description: "Top navigation labels (first 5)",
        },
        {
          key: "search_placeholder",
          description: "Search input placeholder text",
        },
        {
          key: "first_section_heading",
          description: "First H2 or section heading",
        },
        {
          key: "cta_button_text",
          description: "Primary call-to-action button label",
        },
      ],
    },
    {
      url: "https://developer.stripe.com/docs/api",
      fields: [
        { key: "page_title", description: "Document <title> text" },
        { key: "h1_text", description: "Main H1 heading" },
        {
          key: "primary_nav_labels",
          description: "Top navigation labels (first 5)",
        },
        {
          key: "search_placeholder",
          description: "Search input placeholder text",
        },
        {
          key: "first_section_heading",
          description: "First H2 or section heading",
        },
        {
          key: "cta_button_text",
          description: "Primary call-to-action button label",
        },
      ],
    },
    {
      url: "https://developers.notion.com/reference/intro",
      fields: [
        { key: "page_title", description: "Document <title> text" },
        { key: "h1_text", description: "Main H1 heading" },
        {
          key: "primary_nav_labels",
          description: "Top navigation labels (first 5)",
        },
        {
          key: "search_placeholder",
          description: "Search input placeholder text",
        },
        {
          key: "first_section_heading",
          description: "First H2 or section heading",
        },
        {
          key: "cta_button_text",
          description: "Primary call-to-action button label",
        },
      ],
    },
    {
      url: "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html",
      fields: [
        { key: "page_title", description: "Document <title> text" },
        { key: "h1_text", description: "Main H1 heading" },
        {
          key: "primary_nav_labels",
          description: "Top navigation labels (first 5)",
        },
        {
          key: "search_placeholder",
          description: "Search input placeholder text",
        },
        {
          key: "first_section_heading",
          description: "First H2 or section heading",
        },
        {
          key: "cta_button_text",
          description: "Primary call-to-action button label",
        },
      ],
    },
    {
      url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch",
      fields: [
        { key: "page_title", description: "Document <title> text" },
        { key: "h1_text", description: "Main H1 heading" },
        {
          key: "primary_nav_labels",
          description: "Top navigation labels (first 5)",
        },
        {
          key: "search_placeholder",
          description: "Search input placeholder text",
        },
        {
          key: "first_section_heading",
          description: "First H2 or section heading",
        },
        {
          key: "cta_button_text",
          description: "Primary call-to-action button label",
        },
      ],
    },
  ];

  const mcp = new McpStdioClient(mcpCmd);
  await mcp.start({
    ...process.env,
    GEMINI_API_KEY: apiKey,
    GEMINI_MODEL: model,
  });

  let searchMcp:
    | {
        client: McpStdioClient;
        toolName: string;
      }
    | undefined;

  if (searchCmd) {
    const searchClient = new McpStdioClient(searchCmd);
    await searchClient.start({
      ...process.env,
    });
    const searchTools = await searchClient.listTools();
    const toolNames = (searchTools?.tools || []).map((tool: any) => tool.name);
    if (toolNames.includes(searchToolName)) {
      searchMcp = { client: searchClient, toolName: searchToolName };
    } else if (toolNames.length > 0) {
      searchMcp = { client: searchClient, toolName: toolNames[0] };
    }
  }

  const results: any[] = [];

  for (const task of tasks) {
    const noTools = await runAgentNoTools(task, model, apiKey);
    const withMarrowMiss = await runAgentWithMcp(
      task,
      model,
      apiKey,
      mcp,
      "with_marrow_miss",
      searchMcp,
    );
    const withMarrowHit = await runAgentWithMcp(
      task,
      model,
      apiKey,
      mcp,
      "with_marrow_hit",
      searchMcp,
    );

    const noToolsScore = scoreOutput(task.fields, noTools.output || {});
    const missScore = scoreOutput(task.fields, withMarrowMiss.output || {});
    const hitScore = scoreOutput(task.fields, withMarrowHit.output || {});

    results.push({
      url: task.url,
      fields: task.fields,
      runs: [
        { label: "no_tools", ...noTools, score: noToolsScore },
        { label: "with_marrow_miss", ...withMarrowMiss, score: missScore },
        { label: "with_marrow_hit", ...withMarrowHit, score: hitScore },
      ],
    });
  }

  await mcp.close();
  if (searchMcp) {
    await searchMcp.client.close();
  }

  const outDir = path.resolve(process.cwd(), "data", "benchmarks");
  fs.mkdirSync(outDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(outDir, `benchmark-${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ model, results }, null, 2));

  console.log(`Saved benchmark results to: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
