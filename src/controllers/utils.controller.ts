import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { SendErrorResponse, SendResponse } from "../utils";
import { uploadFileR2WithAutoKey } from "../services/r2-storage.service";
import { ApplicationServices, DATA_NOT_FOUND, INPUT_MISSING, UNEXPECTED_ERROR } from "../constants";

const buildErrorPayload = (
  endpoint: string,
  functionName: string,
  method: string,
  message: string,
  error: { code: string; message: string },
  customMsg: string
) => ({
  message,
  data: {
    clientError: { ...error, message: customMsg },
    endpoint,
    functionName,
    method,
    service: ApplicationServices.UTILS,
    id: uuid()
  }
});

export async function uploadImageHandler(req: Request, res: Response) {
  const functionName = uploadImageHandler.name;
  const { file } = req;
  if (!file) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "No image file uploaded",
        INPUT_MISSING,
        "No image file uploaded"
      )
    });
  }

  const filepath = file.path;

  const fileUploadRes = await uploadFileR2WithAutoKey(filepath, "images", false);

  if (!fileUploadRes.success) {
    if (fileUploadRes.code === 404) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          fileUploadRes.message || "Image not found",
          DATA_NOT_FOUND,
          "Image not found"
        )
      });
    }

    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        fileUploadRes.message || "Image upload failed",
        UNEXPECTED_ERROR,
        "Image upload failed"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Image uploaded successfully",
    data: {
      url: fileUploadRes.publicUrl
    }
  });
}

export async function uploadWebsiteImageHandler(req: Request, res: Response) {
  const functionName = uploadWebsiteImageHandler.name;
  const { file } = req;
  if (!file) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "No image file uploaded",
        INPUT_MISSING,
        "No image file uploaded"
      )
    });
  }

  const filepath = file.path;

  const fileUploadRes = await uploadFileR2WithAutoKey(filepath, "website-images", false);

  if (!fileUploadRes.success) {
    if (fileUploadRes.code === 404) {
      return SendErrorResponse.notFound({
        res,
        ...buildErrorPayload(
          req.originalUrl,
          functionName,
          req.method,
          fileUploadRes.message || "Image not found",
          DATA_NOT_FOUND,
          "Image not found"
        )
      });
    }

    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        fileUploadRes.message || "Image upload failed",
        UNEXPECTED_ERROR,
        "Image upload failed"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Image uploaded successfully",
    data: {
      url: fileUploadRes.publicUrl
    }
  });
}
