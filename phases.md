# Marrow 2.0 Execution Roadmap

**Core Philosophy**: Just-In-Time (JIT) Mapping with Network Effects

Marrow doesn't crawl the web upfront. It maps pages **on-demand** when users request them, creating a shared registry that gets better with every use.

## The Vision

**Day 1**: Database is empty.  
**Day 2**: User A requests `linkedin.com/jobs` → Marrow maps it (10s, $0.004).  
**Day 3**: Users B, C, D request `linkedin.com/jobs` → Instant cache hit (0s, $0.00).  
**Day 30**: 1,000 users have collectively mapped the top 50 job sites.  
**Day 90**: New users get 90% of the web "for free."

**This is Waze for web scraping.** The first user on a new page does the work. Everyone else benefits.

## Business Model: BYOK (Bring Your Own Key)

Users provide their own Gemini API key. Marrow provides:

- The orchestration (Cartographer + Mapper)
- The shared registry (cached maps)
- The self-healing system (auto-repair broken selectors)

**Cost per map**: ~$0.004 (less than half a penny)  
**Cost per cached lookup**: ~$0.00

## Phase 1: Foundation & Monorepo ✅

**Goal:** Establish workspace structure.

- [x] Initialize Monorepo (Workspaces)
- [x] Create `apps/cartographer`, `apps/mapper`, `packages/schema`
- [x] Setup shared TSConfig

## Phase 2: The Cartographer (Stealth Crawler) ✅

**Goal:** Build the eyes of the system.

- [x] Setup `apps/cartographer` with Playwright
- [x] Integrate stealth plugins (`playwright-extra`)
- [x] Implement `ContextExtractor` (Axe Tree + HTML)
- [x] **Milestone:** Visit URLs without bot detection

## Phase 3: The Mapper (AI Integration) ✅

**Goal:** Understanding the UI with Gemini 2.0 Flash.

- [x] Integrate Vercel AI SDK (`generateObject`)
- [x] Define Zod schema for structured output
- [x] Implement discovery prompts with heuristics
- [x] Enforce multi-strategy selectors (CSS + XPath)
- [x] **Milestone:** Map `news.ycombinator.com` with 95% accuracy

## Phase 4: The Registry (JIT Database) ✅

**Goal:** Store and serve maps on-demand.

- [x] Setup Convex backend
- [x] Define schema: `page_maps` and `analytics` tables
- [x] Implement Convex functions: `getMap`, `saveMap`, `trackView`, `getStats`
- [x] Build Client SDK (`apps/client`)
- [x] Add fuzzy URL search (domain fallback)
- [x] Implement async analytics tracking (fire-and-forget)
- [x] Add TypeScript path mappings for `@marrow/*` imports
- [ ] Add TTL (Time-To-Live) for auto-refresh
- [x] **Milestone:** First cached map served in <50ms

## Phase 5: Integration Check

**Goal:** Verify the system works before adding new features.

- [x] Build `scripts/test-integration.ts`
- [ ] Test cache miss → map locally → upload → cache hit flow
- [ ] Verify analytics tracking (usage_count, total_requests)
- [ ] **Milestone:** End-to-end integration test passes

## Phase 6: MCP Server (AI Tool Integration)

**Goal:** Enable Claude Code, Cursor, and OpenClaw to use Marrow.

- [ ] Build MCP server exposing Marrow tools:
  - `get_page_map(url)` → Returns cached map
  - `map_page(url)` → Triggers local mapping (Cartographer + Mapper)
- [ ] Publish to MCP registry (or provide local install instructions)
- [ ] Write integration guides for:
  - Claude Code / Cursor (MCP)
  - OpenClaw (direct API)
  - Browser automation tools
- [ ] **Milestone:** Claude Code navigates Stripe docs without hallucinating

## Phase 7: Documentation & Examples

**Goal:** Help developers use Marrow.

- [ ] Write API reference docs
- [ ] Create example scripts:
  - Basic usage (cache hit/miss)
  - Custom domain mapping
  - Analytics dashboard
- [ ] Create video walkthrough
- [ ] Publish to NPM (beta)

## Phase 8: HTTP API (Optional) ✅

**Goal:** Allow non-JS clients to use Marrow.

- [x] Build Express wrapper around Cartographer
- [x] Expose REST endpoints:
  - ~~`GET /v1/map?url=...`~~ (removed - violates BYOK)
  - [x] `POST /v1/validate` (test selectors)
  - [x] `POST /v1/extract` (get content using selectors)
- [x] Add CORS support
- [x] Implement rate limiting
- [x] **Note:** Removed map/manifest/stats endpoints (require API keys, violate BYOK principle)

## Phase 9: Authentication & Session Management (Probe & Escalate)

**Goal:** Handle authenticated pages while preserving privacy.

- [ ] Build Session Vault (`~/.marrow/sessions/{domain}.json`)
  - Store Playwright `storageState` locally
  - Never upload credentials to registry
- [ ] Implement Auth Detection (`verifySession`)
  - HTTP 401/403 detection
  - URL divergence (`/messages` → `/login`)
  - DOM lock signals (`input[type="password"]`)
  - Confidence threshold for auth requirement
- [ ] Build Headless → Headed Escalation
  - Launch interactive browser on auth wall
  - Wait for human login
  - Harvest session state
  - Resume headless with new session
- [ ] Add Session Pre-Check
  - Lightweight "am I logged in?" probe before navigation
  - Detect stale sessions early
- [ ] Handle Cross-Domain SSO
  - Track redirect chains (e.g., LinkedIn → Microsoft login)
  - Store tokens for all domains in chain
- [ ] User Overrides
  - Allow manual "always auth for X domain" declarations
  - Support domain-specific session preferences
- [ ] **Milestone:** Successfully map LinkedIn Jobs while logged in

## Phase 10: Privacy & Sanitization Firewall

**Goal:** Ensure only structural data (selectors) reaches the registry, never content.

- [ ] Implement Sanitization Pipeline
  - Pre-upload filter for all maps
  - Strictly typed using Zod refinements
- [ ] Rule: Text Ban for Private Pages
  - Classify pages as `PUBLIC` vs `PRIVATE`
  - Strip all `text()` strategies from private pages
  - Use heuristics: URL patterns (`/messages`, `/settings`, `/account`)
  - AI confidence scoring for page type
  - User override capability
- [ ] Rule: ID Scrubber
  - Reject UUIDs, hashes, email patterns in selectors
  - Whitelist known structural IDs (`#issue-123`, `#pr-456`)
  - Platform-specific ID patterns (GitHub, Jira, etc.)
- [ ] Rule: Value Purge
  - Never capture `value` attribute of inputs
  - Strip pre-filled form data
- [ ] Add "Dry Run" Mode
  - Preview exact JSON before upload
  - Show what gets stripped by sanitization
  - Require explicit user approval for first upload
  - Build trust through transparency
- [ ] **Milestone:** Map private Gmail inbox without leaking message content

## Phase 11: Semantic Confidence & Soft-Walls

**Goal:** Handle ambiguous auth states and improve detection accuracy.

- [ ] Implement Soft-Wall Detection
  - Detect "you can see but not interact" states
  - JS-rendered login modals (no URL change)
  - Feature-disabled UIs without explicit locks
- [ ] Build Confidence Scoring for Auth
  - Multiple signal aggregation (HTTP + DOM + URL)
  - Threshold-based escalation (e.g., 70% confidence)
  - Machine learning on historical patterns
- [ ] Add Fallback Strategies
  - If headless fails 3x → auto-escalate to headed
  - Remember failure patterns per domain
- [ ] **Milestone:** Detect 95% of auth walls without false positives

## Phase 12: Public Type Definitions

**Goal:** Export proper TypeScript interfaces for SDK consumers.

- [ ] Define `RegistryStats` interface
- [ ] Define `MapElement` interface
- [ ] Define `PageManifest` interface
- [ ] Export all interfaces from `@marrow/client`
- [ ] Remove `as any` casts with proper type definitions

## Phase 13: SDK Enhancement

**Goal:** Developer experience.

- [ ] Build `@marrow/sdk` wrapper
- [ ] Type-safe methods: `marrow.click("job_card")`
- [ ] Auto-retry with fallback strategies

## Phase 14: Self-Healing System

**Goal:** Auto-repair broken selectors.

- [ ] Implement validation: Test selectors on live page
- [ ] If selector fails → trigger AI repair
- [ ] Update registry with new selector
- [ ] Notify users of changes
- [ ] **Milestone:** LinkedIn changes CSS → Marrow auto-heals within 1 hour

---

## Success Metrics

- **Week 1**: Map 1 public site perfectly (Hacker News)
- **Week 2**: Map 1 authenticated site (LinkedIn Jobs)
- **Month 1**: 10 users, 50 unique URLs mapped, zero PII leaks
- **Month 3**: 100 users, 500 URLs, 80% cache hit rate
- **Month 6**: Network effects kick in (new users get instant maps)
