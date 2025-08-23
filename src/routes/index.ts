import express from "express";
import config from "config";

import contactRouter from "./contact.router";
import authRouter from "./auth.router";
import branchRouter from "./branch.router";
import serviceRouter from "./service.router";

import { SendResponse } from "../utils";

const router = express.Router();

const PROJECT_NAME: string = config.get<string>("server.projectName") || "Backend Starter Service";

router.get("/", (req, res): void => {
  SendResponse.success({ res, message: `${PROJECT_NAME} - v1 API root directory` });
});

router.use("/auth", authRouter);
router.use("/contact", contactRouter);
router.use("/branch", branchRouter);
router.use("/service", serviceRouter);

export default router;
