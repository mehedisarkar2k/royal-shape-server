import express from "express";
import config from "config";

import contactRouter from "./contact.router";
import authRouter from "./auth.router";
import branchRouter from "./branch.router";
import serviceRouter from "./service.router";
import bookingRouter from "./booking.router";
import customerRouter from "./customer.router";
import employeeRouter from "./employee.router";
import utilsRouter from "./utils.router";
import careerRouter from "./career.router";

import { SendResponse } from "../utils";

const router = express.Router();

const PROJECT_NAME: string =
  process.env.PROJECT_NAME || config.get<string>("server.projectName") || "Backend Starter Service";

router.get("/", (req, res): void => {
  SendResponse.success({ res, message: `${PROJECT_NAME} - v1 API root directory` });
});

router.use("/auth", authRouter);
router.use("/contact", contactRouter);
router.use("/branch", branchRouter);
router.use("/service", serviceRouter);
router.use("/booking", bookingRouter);
router.use("/customer", customerRouter);
router.use("/employee", employeeRouter);
router.use("/utils", utilsRouter);
router.use("/career", careerRouter);

export default router;
