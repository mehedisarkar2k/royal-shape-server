import express from "express";
import config from "config";

import contactRouter from "./contact.router";

import { SendResponse } from "../utils";

const router = express.Router();

const PROJECT_NAME: string = config.get<string>("server.projectName") || "Backend Starter Service";

router.get("/", (req, res): void => {
  SendResponse.success({ res, message: `${PROJECT_NAME} - v1 API root directory` });
});

router.use("/contact", contactRouter);

export default router;
