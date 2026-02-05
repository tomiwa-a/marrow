# Marrow 2.0

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Convex](https://img.shields.io/badge/Convex-000000?style=for-the-badge&logo=vercel&logoColor=white)

**The Semantic DNS for AI Agents.**

## What is Marrow 2.0?

Marrow is a decentralized registry that maps the dynamic web into structured, semantic component maps.

**The Problem:** AI agents today are fragile. They scrape blindly, break when CSS changes, and waste tokens re-analyzing the same HTML.
**The Solution:** Marrow decouples _understanding_ the UI (slow, expensive) from _interacting_ with it (fast, cheap). It provides a real-time API that tells agents exactly where "The Apply Button" is, right now.

## Architecture (The Pivot)

Marrow has evolved from a single Job Bot into the **Infrastructure** that powers all bots.

### 1. The Cartographer (Writer)

A background crawler that navigates the web, uses LLMs to identify UI components (Job Cards, Nav Bars), and publishes "Maps" to the registry.

### 2. The Registry (Brain)

A centralized **Convex** database that stores semantic maps. It creates a "Living Standard" for UI components, syncing updates to all connected agents in real-time.

### 3. The Client SDK (Reader)

A type-safe library (`@marrow/sdk`) that allows developers to write resilient agents:

```typescript
// Instead of page.click('.btn-primary'), do:
await marrow.click("LinkedIn.JobCard.ApplyButton");
```

## Legacy V1 (Job Bot)

The original V1 autonomous job agent has been archived to `v1_agent/`.
It is a standalone CLI tool that navigates LinkedIn. The new Marrow 2.0 infrastructure is being built to power the next generation of this bot.

[View V1 Source Code](./v1_agent/README.md)

## Status

🚧 **Phase 1: Skeleton (MVP)** - Currently building the Core Data Model.

## Author

Built by [@tomiwa_amole](https://twitter.com/tomiwa_amole)

## License

MIT
