import express from "express";
import config from "config";

import authRouter from "./auth.router";
import branchRouter from "./branch.router";
import serviceRouter from "./service.router";
import bookingRouter from "./booking.router";
import customerRouter from "./customer.router";
import employeeRouter from "./employee.router";
import utilsRouter from "./utils.router";
import careerRouter from "./career.router";
import adminRouter from "./admin.router";
import engagementRouter from "./engagement.router";
import publicRouter from "./public.router";
import promotionRouter from "./promotion.router";
import blogRouter from "./blog.router";

import { SendResponse } from "../utils";

const router = express.Router();

const PROJECT_NAME: string =
  process.env.PROJECT_NAME || config.get<string>("server.projectName") || "Backend Starter Service";

router.get("/", (req, res): void => {
  SendResponse.success({ res, message: `${PROJECT_NAME} - v1 API root directory` });
});

router.use("/auth", authRouter);
router.use("/branch", branchRouter);
router.use("/service", serviceRouter);
router.use("/booking", bookingRouter);
router.use("/customer", customerRouter);
router.use("/employee", employeeRouter);
router.use("/utils", utilsRouter);
router.use("/career", careerRouter);
router.use("/admin", adminRouter);
router.use("/engagement", engagementRouter);
router.use("/public", publicRouter);
router.use("/promotion", promotionRouter);
router.use("/blog", blogRouter);

export default router;
