import winston from "winston";

// Logs go to stdout only; the host (Railway, Docker, etc.) collects them.
// Writing to local files on an ephemeral container just loses them.
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  silent: process.env.NODE_ENV === "test",
  defaultMeta: { service: "shieldauth-api" },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === "production"
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple())
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
