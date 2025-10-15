/* eslint-disable */

import { Request, Response } from "express";
import { PostWebsiteAboutDataType, PostWebsiteHomeDataType, PostWebsiteServiceDataType } from "../schemas";
import { SendResponse } from "../utils";

export async function postWebsiteHomeDataHandler(
  req: Request<Record<string, never>, Record<string, never>, PostWebsiteHomeDataType>,
  res: Response
) {
  const functionName = postWebsiteHomeDataHandler.name;
  const data = req.body;

  return SendResponse.success({
    res,
    message: "Website home data posted successfully",
    data: null
  });
}

export async function postWebsiteServiceDataHandler(
  req: Request<Record<string, never>, Record<string, never>, PostWebsiteServiceDataType>,
  res: Response
) {
  const functionName = postWebsiteHomeDataHandler.name;
  const data = req.body;

  return SendResponse.success({
    res,
    message: "Website service data posted successfully",
    data: null
  });
}

export async function postWebsiteAboutDataHandler(
  req: Request<Record<string, never>, Record<string, never>, PostWebsiteAboutDataType>,
  res: Response
) {
  const functionName = postWebsiteAboutDataHandler.name;
  const data = req.body;

  return SendResponse.success({
    res,
    message: "Website about data posted successfully",
    data: null
  });
}
