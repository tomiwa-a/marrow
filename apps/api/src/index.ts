import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { ValidateController } from "./controllers/ValidateController.js";
import { ExtractController } from "./controllers/ExtractController.js";
import { HealthController } from "./controllers/HealthController.js";

const port = parseInt(process.env.PORT || "3000", 10);

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

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

const healthController = new HealthController();
const validateController = new ValidateController();
const extractController = new ExtractController();

app.get("/", healthController.info.bind(healthController));
app.get("/health", healthController.health.bind(healthController));

app.post("/v1/validate", validateController.validate.bind(validateController));
app.post("/v1/extract", extractController.extract.bind(extractController));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`[Marrow API] Server running on http://localhost:${port}`);
  console.log(`[Marrow API] BYOK - Bring Your Own Key (no server-side API keys)`);
});
