import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import config from "config";
import helmet from "helmet";
import cors, { CorsOptions } from "cors";

import v1Router from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { SendResponse } from "./utils";
import { deserializeUser } from "./middleware";

const app: Express = express();

const PROJECT_NAME: string =
  process.env.PROJECT_NAME || config.get<string>("server.projectName") || "Royal Threading and Beauty";
const ENVIRONMENT: string = process.env.ENVIRONMENT || config.get<string>("server.environment");
const v1BaseEndpoint = ENVIRONMENT && ENVIRONMENT.toLowerCase() === "development" ? "/api/v1" : "/v1";

app.use(express.json());
app.use(helmet());

const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (!envOrigins) return [];
  return envOrigins.split(",").map((origin) => origin.trim());
};

const restrictiveCorsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    // Allow if origin is in the list, or if there is no origin (e.g. Server-to-server requests / curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
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

app.use(deserializeUser);

app.get("/", (req: Request, res: Response): void => {
  SendResponse.success({ res, message: `Hello from ${PROJECT_NAME} Backend Service!!!` });
});

app.use(v1BaseEndpoint, v1Router);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
