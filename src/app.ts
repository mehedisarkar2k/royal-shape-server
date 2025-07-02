import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import config from "config";
import helmet from "helmet";
import cors, { CorsOptions } from "cors";

import v1Router from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { SendResponse } from "./utils";
// import { deserializeUser } from "./middleware"; TODO: activate this middleware when auth is implemented

const app: Express = express();

const PROJECT_NAME: string = config.get<string>("server.projectName") || "Royal Threading and Beauty";
const ENVIRONMENT: string = config.get<string>("server.environment");
const v1BaseEndpoint = ENVIRONMENT && ENVIRONMENT.toLowerCase() === "development" ? "/api/v1" : "/v1";

app.use(express.json());
app.use(helmet());

const restrictiveCorsOptions: CorsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004"
  ],
  credentials: true
};

// ! global
const configGlobalCorsOptions: CorsOptions = {
  origin: "*",
  credentials: false
};

app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.ENVIRONMENT === "development") {
    cors(configGlobalCorsOptions)(req, res, next);
  } else {
    cors(restrictiveCorsOptions)(req, res, next);
  }
});

// app.use(deserializeUser); TODO: activate this middleware when auth is implemented

app.get("/", (req: Request, res: Response): void => {
  SendResponse.success({ res, message: `Hello from ${PROJECT_NAME} Backend Service!!!` });
});

app.use(v1BaseEndpoint, v1Router);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
