import "dotenv/config";

import config from "config";
import app from "./app";
import { logger, dbConnection } from "./utils";
import { initializeFirebase } from "./services";

const port: number = config.get("server.port");

const start = async () => {
  try {
    await dbConnection();
    await initializeFirebase();

    app.listen(port, async () => {
      logger.info(`Server is up & running on http://localhost:${port}`);
    });
  } catch (error) {
    // console.log(error);
    logger.error("An error occurred while connecting to the database or firebase", (error as Error).message);
  }
};

start();
