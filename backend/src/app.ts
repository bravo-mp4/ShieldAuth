import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import routes from "./routes";
import { config } from "./config";
import { pool } from "./database";
import { securityHeaders, apiLimiter } from "./middleware/security";
import logger from "./logger";

export function createApp() {
  const app = express();

  app.set("trust proxy", config.trustProxy);
  app.disable("x-powered-by");
  app.use(securityHeaders);

  // The dashboard authenticates with a bearer token, not cookies, so CORS
  // here limits which sites can call the API from a browser; it isn't
  // standing in for CSRF protection. SDK clients send no Origin header.
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || config.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(null, false);
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Session-Id"],
    })
  );

  app.use(express.json({ limit: "100kb" }));

  app.get("/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "healthy", database: "connected", timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: "unhealthy", database: "disconnected" });
    }
  });

  app.use("/api", apiLimiter);
  app.use("/api/v1", routes);

  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  // Express 5 forwards rejected promises from async handlers here.
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) {
      logger.error("Unhandled error", { error: err.message, stack: err.stack, path: req.path });
    }
    res.status(status).json({
      message: status >= 500 ? "Internal server error" : err.message,
    });
  });

  return app;
}
