import { NextFunction, Request, Response } from "express";
import { AxiosError } from "axios";
import { logger } from "../utils";
import { UNEXPECTED_ERROR, httpStatus } from "../constants";

const notFoundHandler = (req: Request, res: Response) => {
  // Respond directly — do NOT forward to errorHandler, which would try to send
  // a second response and throw ERR_HTTP_HEADERS_SENT (and log every bot 404).
  res.status(httpStatus.NOT_FOUND).json({
    message: `Not Found - ${req.originalUrl}`,
    success: false
  });
};

const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // If the response has already started, defer to Express's default handler
  // instead of writing headers twice (ERR_HTTP_HEADERS_SENT).
  if (res.headersSent) return next(error);

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

  res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: error.name.concat(": ").concat(error.message),
    data: { clientError },
    stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack
  });
};

export { notFoundHandler, errorHandler };
