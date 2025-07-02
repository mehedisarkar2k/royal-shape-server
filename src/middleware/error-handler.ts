import { NextFunction, Request, Response } from "express";
import { AxiosError } from "axios";
import { logger } from "../utils";
import { UNEXPECTED_ERROR, httpStatus } from "../constants";

const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(httpStatus.NOT_FOUND).json({ message: error.message, success: false });
  next(error);
};

const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const clientError = UNEXPECTED_ERROR;
  logger.error(`An unexpected error (path: ${req.path} | method: ${req.method}): `.concat(error.message));
  // console.log(
  //   "========================= Error Occurred =========================\n",
  //   error,
  //   "\n========================= Error End =========================\n"
  // );

  if (error instanceof AxiosError) {
    const statusCode = error.response?.data?.message?.toLowerCase().includes("not found")
      ? httpStatus.NOT_FOUND
      : error.response?.status || httpStatus.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json({
      success: false,
      message: error.response?.data?.message,
      data: { clientError },
      stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack
    });
    return;
  }

  const { statusCode } = res;
  res.status(statusCode).json({
    success: false,
    message: error.name.concat(": ").concat(error.message),
    data: { clientError },
    stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack
  });
  return next();
};

export { notFoundHandler, errorHandler };
