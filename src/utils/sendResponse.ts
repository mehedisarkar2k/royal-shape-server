// sendResponse.ts
import { Response } from "express";
import { httpStatus } from "../constants";

interface SendResponseProps<T> {
  res: Response;
  data?: T;
  message?: string;
}

export class SendResponse {
  private static sendResponse<T>(res: Response, statusCode: number, { data, message }: SendResponseProps<T>) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static success<T>(props: SendResponseProps<T>) {
    return this.sendResponse(props.res, httpStatus.OK, props);
  }

  static created<T>(props: SendResponseProps<T>) {
    return this.sendResponse(props.res, httpStatus.CREATED, props);
  }

  static updated<T>(props: SendResponseProps<T>) {
    return this.sendResponse(props.res, httpStatus.OK, props);
  }

  static deleted<T>(props: SendResponseProps<T>) {
    return this.sendResponse(props.res, httpStatus.OK, props);
  }
}
