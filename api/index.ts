import "dotenv/config";
import app from "../src/app";
import { logger, dbConnection } from "../src/utils";
import { initializeFirebase } from "../src/services";

// Initialize everything before exporting the app
const initializeApp = async () => {
  try {
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
