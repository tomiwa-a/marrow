# Marrow

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)

A stealth AI agent that automates job hunting using computer vision and LLM reasoning.

## What is Marrow?

Marrow is a CLI-based autonomous agent that navigates job sites like LinkedIn, mimicking human behavior to research companies and apply for jobs. Unlike traditional scrapers, it uses computer vision to understand dynamic web pages and LLM reasoning to make decisions.

## Features

- **Multi-Provider AI**: Works with local LLMs (Ollama) or cloud providers (Gemini, GPT-4o)
- **Swarm Intelligence**: Spawns parallel worker agents that share findings
- **Stealth Browsing**: Masked browser fingerprints and human-like interactions
- **Interactive CLI**: Real-time logs showing the agent's thought process

## Setup & Installation

### Prerequisites

- **Node.js** 18+
- **Ollama** (for local LLM support) - [Install here](https://ollama.ai)
- **API Keys** (optional): Gemini or OpenAI for cloud mode

### Install

```bash
# Clone the repository
git clone https://github.com/tomiwa-a/marrow.git
cd marrow

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run in dev mode (uses Ollama)
npm run dev

# Run in prod mode (uses Cloud LLMs)
npm start
```

### Quick Start

```bash
# Start the agent
npm start

# Follow the CLI prompts to:
# 1. Set your job search criteria
# 2. Let Marrow browse and apply
# 3. Review results in data/session.json
```

## Development Tools

### Snapshot & Selector Testing

Speed up development by capturing LinkedIn pages locally and testing selectors offline:

```bash
# Capture a page snapshot
npm run snapshot jobs

# Test selectors offline (instant, no browser)
npm run test-selectors jobs

# Test specific selector
npm run test-selectors jobs jobCard
```

Benefits:

- **Instant feedback** - No browser overhead
- **Offline development** - Work without LinkedIn access
- **Precise debugging** - Inspect captured HTML directly

## Why Marrow?

Job hunting is repetitive. Marrow automates the boring parts while you focus on preparing for interviews.

## Status

🚧 Early development - contributions welcome!

## Author

Built by [@tomiwa_amole](https://twitter.com/tomiwa_amole)

## License

MIT
