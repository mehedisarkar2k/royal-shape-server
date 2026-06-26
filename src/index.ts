import "dotenv/config";

import config from "config";
import app from "./app";
import { logger, dbConnection } from "./utils";
import { initializeFirebase, CronService } from "./services";

const port: number = config.get("server.port");

const start = async () => {
  try {
    await dbConnection();
    await initializeFirebase();

    // Start background cron jobs
    CronService.start();

    app.listen(port, async () => {
      logger.info(`Server is up & running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Server start error:", error);
    logger.error("An error occurred while connecting to the database or firebase");
  }
};

start();
