import { config } from "./config";
import { createApp } from "./app";
import { pool } from "./database";
import logger from "./logger";

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`ShieldAuth API listening on port ${config.port}`);
  logger.info(`Allowed browser origins: ${config.corsOrigins.join(", ") || "(none)"}`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
