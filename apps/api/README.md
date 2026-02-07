# Marrow HTTP API

REST API for web scraping with **BYOK** (Bring Your Own Key) - no server-side API keys required.

## Quick Start

```bash
cd apps/api
npm install
npm run dev
```

Server runs on `http://localhost:3000`

## Environment Variables

```bash
PORT=3000                    # Server port (default: 3000)
ALLOWED_ORIGINS=*            # CORS origins (default: *)
RATE_LIMIT=100               # Requests per minute (default: 100)
```

## Endpoints

### GET /

API information and available endpoints.

```bash
curl http://localhost:3000/
```

### GET /health

Health check endpoint.

```bash
curl http://localhost:3000/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": 1707334567890
}
```

### POST /v1/validate

Test if CSS selectors work on a page.

```bash
curl -X POST http://localhost:3000/v1/validate \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://news.ycombinator.com",
    "selectors": [".titleline > a", ".subtext"]
  }'
```

**Request Body:**

```typescript
{
  url: string;        // Target URL
  selectors: string[]; // CSS selectors to test
}
```

**Response:**

```json
{
  "valid": true,
  "results": [
    {
      "selector": ".titleline > a",
      "found": true,
      "value": "Example Title"
    },
    {
      "selector": ".subtext",
      "found": true,
      "value": "123 points by user"
    }
  ]
}
```

### POST /v1/extract

Extract content from a page using CSS selectors.

```bash
curl -X POST http://localhost:3000/v1/extract \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://news.ycombinator.com",
    "selectors": [".titleline > a", ".score"],
    "debug": false
  }'
```

**Request Body:**

```typescript
{
  url: string;        // Target URL
  selectors: string[]; // CSS selectors to extract
  debug?: boolean;     // Include timing info (optional)
}
```

**Response:**

```json
{
  "data": {
    ".titleline > a": "Example Title",
    ".score": "123 points"
  }
}
```

**With debug=true:**

```json
{
  "data": {
    ".titleline > a": "Example Title",
    ".score": "123 points"
  },
  "debug": {
    "timingsMs": { "total": 1234 },
    "cartographer": { ... }
  }
}
```

## Architecture

### File Structure

```
apps/api/
├── src/
│   ├── controllers/
│   │   ├── HealthController.ts      # Health check and API info
│   │   ├── ValidateController.ts    # Selector validation
│   │   ├── ExtractController.ts     # Content extraction
│   │   └── RegistryController.ts    # Registry queries
│   ├── middleware/
│   │   ├── errorHandler.ts          # Error handling
│   │   ├── requestLogger.ts         # Request logging
│   │   └── index.ts                 # Middleware exports
│   ├── routes/
│   │   └── index.ts                 # Route definitions
│   └── index.ts                     # App initialization
├── package.json
├── tsconfig.json
└── README.md
```

### Controllers

- **HealthController** - Health check and API info
- **ValidateController** - Selector validation
- **ExtractController** - Content extraction
- **RegistryController** - Convex registry queries (getMap, getManifest, getStats)

All controllers follow OOP principles with dependency injection where needed.

### Middleware Stack

1. **JSON Parser** - `express.json()`
2. **CORS** - Configurable origins (default: `*`)
3. **Rate Limiting** - 100 req/min per IP (configurable)
4. **Request Logger** - Timestamps and request paths
5. **Error Handler** - Centralized error responses

## Development

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Production
npm start
```

## Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test validation
curl -X POST http://localhost:3000/v1/validate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","selectors":[".title"]}'

# Test extraction
curl -X POST http://localhost:3000/v1/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","selectors":[".title"]}'
```

## BYOK Philosophy

This API does **NOT** require server-side API keys. It provides:

- Selector validation
- Content extraction

It does **NOT** provide:

- Page mapping (requires Gemini API key)
- Registry access (requires Convex credentials)

Users should use the MCP server or client SDK for full functionality with their own API keys.
