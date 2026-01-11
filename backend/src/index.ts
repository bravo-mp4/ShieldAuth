import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import { pool } from "./database";
import { securityHeaders, apiLimiter } from "./middleware/security";
import logger from "./logger";

dotenv.config();

// Validate environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missingEnvVars.join(", ")
  );
  console.error("Please set these in Railway dashboard → Variables");
  process.exit(1);
}

logger.info("All required environment variables present");

const app = express();
const PORT = process.env.PORT || 3000;

// Apply security headers
app.use(securityHeaders);

// Configure CORS for production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://shield-auth.vercel.app",
  process.env.FRONTEND_URL || "",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// Health check endpointimit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Global error handler", { error: err.message, stack: err.stack });
    res.status(err.status || 500).json({
      message: err.message || "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
);    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing database pool...");
  await pool.end();
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`ShieldAuth API running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`Allowed origins: ${allowedOrigins.join(", ")}`);
});onsole.log(`ShieldAuth API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
});
