import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { ApplicationServices, DATA_NOT_FOUND, INPUT_MISSING, UNEXPECTED_ERROR } from "../constants";
import { CreateAwardInput, UpdateAwardInput } from "../schemas";
import { countAllAwards, createAward, findAllAwardsPaginated, findAwardById } from "../services";
import { SendErrorResponse, SendResponse } from "../utils";
import { uploadFileR2WithAutoKey } from "../services/r2-storage.service";

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
    service: ApplicationServices.AWARD,
    id: uuid()
  }
});

export async function addAwardHandler(
  req: Request<Record<string, never>, Record<string, never>, CreateAwardInput>,
  res: Response
) {
  const functionName = addAwardHandler.name;
  const data = req.body;

  const award = await createAward({
    title: data.title,
    issuer: data.issuer,
    year: data.year,
    description: data.description,
    badgeImage: data.badgeImage,
    category: data.category
  });
  if (!award) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to create award",
        UNEXPECTED_ERROR,
        "Failed to create award due to an internal error"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Award added successfully",
    data: { award: { id: award._id.toString() } }
  });
}

export async function getAllAwardsHandler(req: Request, res: Response) {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "20", 10);

  const awards = await findAllAwardsPaginated(page, limit);
  const totalAwards = await countAllAwards();

  const totalPages = Math.ceil(totalAwards / limit);
  const hasNext = page < totalPages;

  const finalAwards = awards.map((award) => ({
    id: award._id.toString(),
    title: award.title,
    issuer: award.issuer,
    year: award.year,
    description: award.description,
    badgeImage: award.badgeImage,
    category: award.category
  }));

  return SendResponse.success({
    res,
    message: "Awards retrieved successfully",
    data: {
      items: finalAwards,
      currentPage: page,
      limit,
      totalItems: totalAwards,
      totalPages,
      hasNext
    }
  });
}

export async function getSingleAwardDetailsHandler(req: Request, res: Response) {
  const functionName = getSingleAwardDetailsHandler.name;
  const { awardId } = req.params;

  const award = await findAwardById(awardId);
  if (!award) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Award not found",
        DATA_NOT_FOUND,
        "Award not found"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Fetched award successfully",
    data: {
      award: {
        id: award._id.toString(),
        title: award.title,
        issuer: award.issuer,
        year: award.year,
        description: award.description,
        badgeImage: award.badgeImage,
        category: award.category
      }
    }
  });
}

export async function editAwardDetailsHandler(
  req: Request<{ awardId: string }, Record<string, never>, UpdateAwardInput>,
  res: Response
) {
  const functionName = editAwardDetailsHandler.name;
  const { awardId } = req.params;
  const data = req.body;

  const award = await findAwardById(awardId);
  if (!award) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Award not found",
        DATA_NOT_FOUND,
        "Award not found"
      )
    });
  }

  award.title = data.title ?? award.title;
  award.issuer = data.issuer ?? award.issuer;
  award.year = data.year ?? award.year;
  award.description = data.description ?? award.description;
  award.badgeImage = data.badgeImage ?? award.badgeImage;
  award.category = data.category ?? award.category;
  await award.save();

  return SendResponse.success({
    res,
    message: "Award updated successfully",
    data: {
      award: {
        id: award._id.toString()
      }
    }
  });
}

export async function deleteAwardHandler(req: Request, res: Response) {
  const functionName = deleteAwardHandler.name;
  const { awardId } = req.params;

  const award = await findAwardById(awardId);
  if (!award) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Award not found",
        DATA_NOT_FOUND,
        "Award not found"
      )
    });
  }

  await award.deleteOne();

  return SendResponse.success({
    res,
    message: "Award deleted successfully",
    data: null
  });
}

export async function getAllAwardsPublicHandler(req: Request, res: Response) {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "20", 10);

  const awards = await findAllAwardsPaginated(page, limit);
  const totalAwards = await countAllAwards();

  const totalPages = Math.ceil(totalAwards / limit);
  const hasNext = page < totalPages;

  const finalAwards = awards.map((award) => ({
    id: award._id.toString(),
    title: award.title,
    issuer: award.issuer,
    year: award.year,
    description: award.description,
    badgeImage: award.badgeImage,
    category: award.category
  }));

  return SendResponse.success({
    res,
    message: "Awards retrieved for public successfully",
    data: {
      items: finalAwards,
      currentPage: page,
      limit,
      totalItems: totalAwards,
      totalPages,
      hasNext
    }
  });
}

export async function uploadAwardBannerImageHandler(req: Request, res: Response) {
  const functionName = uploadAwardBannerImageHandler.name;
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

  const fileUploadRes = await uploadFileR2WithAutoKey(filepath, "award-images", false);

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
