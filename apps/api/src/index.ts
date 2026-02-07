import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createRouter } from "./routes";
import { errorHandler, requestLogger } from "./middleware";

const port = parseInt(process.env.PORT || "3000", 10);
const convexUrl = process.env.CONVEX_URL || "https://jovial-ibis-732.convex.cloud";

const app = express();

app.use(express.json());

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];
app.use(
  cors({
    origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
  })
);

const rateLimitMax = parseInt(process.env.RATE_LIMIT || "100", 10);
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded. Please try again later." },
});
app.use(limiter);

app.use(requestLogger);

app.use(createRouter(convexUrl));

app.use(errorHandler);

app.listen(port, () => {
  console.log(`[Marrow API] Server running on http://localhost:${port}`);
  console.log(`[Marrow API] Registry: ${convexUrl}`);
  console.log(`[Marrow API] BYOK - Bring Your Own Key (no server-side API keys)`);
});