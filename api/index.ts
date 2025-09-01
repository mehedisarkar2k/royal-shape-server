import "dotenv/config";
import config from "config";
import app from "../src/app";
import { logger, dbConnection } from "../src/utils";
import { initializeFirebase } from "../src/services";

// Initialize everything before exporting the app
const initializeApp = async () => {
  try {
    // Debug: Log environment variables to verify they're available
    logger.info("Environment check - SMTP_EMAIL:", process.env.SMTP_EMAIL ? "Set" : "Not Set");
    logger.info("Environment check - MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not Set");

    // Debug: Log some config values to verify they're loaded
    logger.info("Config check - Project name:", config.get("server.projectName"));
    logger.info("Config check - Environment:", config.get("server.environment"));

    await dbConnection();
    await initializeFirebase();
    logger.info("Serverless function initialized successfully");
  } catch (error) {
    logger.error("An error occurred while connecting to the database or firebase", (error as Error).message);
    // Log the specific error details
    if (error instanceof Error) {
      logger.error("Error details:", error.stack);
    }
    throw error;
  }
};

// Initialize on first import
initializeApp();

export default app;
