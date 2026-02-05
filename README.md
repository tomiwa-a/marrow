# Marrow 2.0

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

**Waze for Web Scraping**

## What is Marrow?

Marrow is a **shared registry** that maps the structure of the web on-demand, making AI agents resilient to UI changes.

### The Problem

AI agents today are fragile:

- They scrape blindly using brittle CSS selectors
- They break when websites change
- They waste tokens re-analyzing the same HTML
- Every developer reinvents the wheel

### The Solution

Marrow decouples **understanding** the UI (slow, expensive) from **using** it (fast, cheap).

**Instead of this:**

```typescript
await page.click(".btn-primary"); // Breaks when CSS changes
```

**Do this:**

```typescript
const map = await marrow.getMap("linkedin.com/jobs");
await page.click(map.elements.apply_button.strategies[0].value);
```

## How It Works (JIT Mapping)

Marrow doesn't crawl the web upfront. It maps pages **on-demand** when users request them.

**Day 1**: Database is empty.  
**Day 2**: User A requests `linkedin.com/jobs` → Marrow maps it (10s, $0.004).  
**Day 3**: Users B, C, D request `linkedin.com/jobs` → Instant cache hit (0s, $0.00).

**This is Waze.** The first driver on a new road does the work. Everyone else benefits.

## Architecture

### 1. The Cartographer (Crawler)

A stealth browser that navigates pages without getting blocked.

- Uses Playwright + stealth plugins
- Extracts HTML and accessibility tree
- Runs headless or visible for debugging

### 2. The Mapper (AI)

Gemini 2.0 Flash analyzes the page structure and returns stable selectors.

- Identifies containers, buttons, links, forms
- Provides multiple fallback strategies (CSS, XPath, ARIA)
- Enforces semantic naming (`job_card`, not `div_123`)

### 3. The Registry (Database)

A shared database (Convex/Supabase) that stores maps.

- Serves cached maps in <50ms
- Auto-refreshes stale maps
- Self-heals broken selectors

## Business Model: BYOK (Bring Your Own Key)

Users provide their own Gemini API key. Marrow provides the infrastructure.

**Why this works:**

- **Zero AI costs** for Marrow (users pay Google directly)
- **Network effects** (shared maps benefit everyone)
- **Scalable** (no upfront crawling needed)

**Cost per map**: ~$0.004 (less than half a penny)  
**Cost per cached lookup**: ~$0.00

## Current Status

🚧 **Phase 3 Complete** - Cartographer + Mapper integration working  
🔨 **Phase 4 In Progress** - Building the Registry (JIT database)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/yourusername/marrow.git
cd marrow

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your GEMINI_API_KEY

# Test the integration
npx tsx scripts/test-integration.ts https://news.ycombinator.com
```

## Use Cases

### 1. AI Coding Assistants (Claude Code, Cursor, Windsurf)

**Problem**: AI assistants hallucinate selectors when navigating documentation or web apps.

**Solution**: Marrow MCP Server provides reliable selectors.

```typescript
// Claude Code calls Marrow via MCP:
const map = await marrow.getMap("stripe.com/docs");
await page.click(map.elements.search_input.strategies[0].value);
```

### 2. Browser Automation (OpenClaw, Skyvern, Browserbase)

**Problem**: Automation scripts break when websites change CSS.

**Solution**: Tools query Marrow for current selectors.

```typescript
// OpenClaw sends Instagram DM:
const map = await marrow.getMap("instagram.com/direct");
await page.click(map.elements.new_message_button.strategies[0].value);
```

### 3. Data Extraction (Apify, Bright Data)

Reduce scraper maintenance by 90% with shared, auto-healing maps.

### 4. AI Agents (AutoGPT, BabyAGI)

Save tokens by using cached maps instead of re-analyzing pages.

### 5. QA Testing (Playwright, Cypress)

Write resilient tests that survive CSS refactors.

## Roadmap

See [phases.md](./phases.md) for the full roadmap.

**Next Milestones:**

- [ ] Phase 4: JIT Registry (Convex backend)
- [ ] Phase 5: Self-healing selectors
- [ ] Phase 6: Public API

## Legal & Ethics

**What Marrow does**: Maps the **structure** of pages (CSS selectors, element locations).  
**What Marrow does NOT do**: Scrape **content** (text, images, videos).

**Analogy**: Marrow sells treasure maps, not the treasure itself.

Mapping functional facts (e.g., "the button has ID `#submit`") is significantly safer than scraping creative content.

## Legacy V1 (Job Bot)

The original V1 autonomous job agent has been archived to `v1_agent/`.  
It is a standalone CLI tool that navigates LinkedIn.

[View V1 Source Code](./v1_agent/README.md)

## Author

Built by [@tomiwa_amole](https://twitter.com/tomiwa_amole)

## License

MIT
