import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import logger from "../logger";

const limitDisabled = process.env.NODE_ENV === "test" && process.env.TEST_RATE_LIMITS !== "true";

function limiter(windowMs: number, limit: number, message: string, options = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => limitDisabled,
    message: { message },
    ...options,
  });
}

// General API traffic: dashboard pages make several calls per view.
export const apiLimiter = limiter(15 * 60 * 1000, 1000, "Too many requests, please try again later.");

// Login and registration: slow down credential stuffing and sign-up spam.
// Successful logins don't count, so a real user never hits this.
export const authLimiter = limiter(15 * 60 * 1000, 10, "Too many attempts, please try again later.", {
  skipSuccessfulRequests: true,
});

// SDK clients validate on start-up and then send heartbeats.
export const licenseValidationLimiter = limiter(60 * 1000, 60, "License validation rate limit exceeded");

// Unauthenticated write endpoints (contact form, likes, portal actions).
export const publicWriteLimiter = limiter(60 * 60 * 1000, 20, "Too many requests, please try again later.");

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
});

// Records who did what on platform-admin routes.
export const auditLog = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      logger.info("audit", {
        action,
        user: req.user?.email,
        ip: req.ip,
        status: res.statusCode,
        target: req.params.id || req.params.key,
      });
    });
    next();
  };
};
