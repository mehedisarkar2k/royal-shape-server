import "dotenv/config";

import config from "config";
import app from "./app";
import { logger, dbConnection } from "./utils";

const port: number = config.get("server.port");

const start = async () => {
  try {
    await dbConnection();

    app.listen(port, async () => {
      logger.info(`Server is up & running on http://localhost:${port}`);
    });
  } catch (error) {
    // console.log(error);
    logger.error("An error occurred while connecting to the database", (error as Error).message);
  }
};

start();
