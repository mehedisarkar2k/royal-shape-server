import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { PromotionModel } from "../model";
import { CreatePromotionType } from "../schemas";
import { SendErrorResponse, SendResponse } from "../utils";
import { ApplicationServices, DATA_NOT_FOUND, UNEXPECTED_ERROR } from "../constants";

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
    service: ApplicationServices.PROMOTION,
    id: uuid()
  }
});

export async function createPromotionHandler(
  req: Request<Record<string, never>, Record<string, never>, CreatePromotionType>,
  res: Response
) {
  const functionName = createPromotionHandler.name;
  const {
    title,
    description,
    bannerImage,
    buttonText,
    buttonLink,
    isActive,
    titleColor,
    descriptionColor,
    buttonBgColor,
    buttonTextColor
  } = req.body;

  const promotion = await PromotionModel.create({
    title: title.trim(),
    description: description.trim(),
    bannerImage: bannerImage.trim(),
    buttonText: buttonText.trim(),
    buttonLink: buttonLink.trim(),
    titleColor: titleColor.trim(),
    descriptionColor: descriptionColor.trim(),
    buttonBgColor: buttonBgColor.trim(),
    buttonTextColor: buttonTextColor.trim(),
    isActive: isActive ?? false
  });

  if (!promotion) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to create promotion",
        UNEXPECTED_ERROR,
        "Failed to create promotion"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Promotion created successfully",
    data: {
      promotion: { id: promotion._id.toString() }
    }
  });
}

export async function getAllPromotionsHandler(req: Request, res: Response) {
  // const functionName = getAllPromotionsHandler.name;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const skip = (page - 1) * limit;

  const promotions = await PromotionModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

  const totalPromotions = await PromotionModel.countDocuments();
  const totalPages = Math.ceil(totalPromotions / limit);
  const hasNext = page * limit < totalPromotions;

  const promotionsFormatted = promotions.map((promo) => ({
    id: promo._id.toString(),
    title: promo.title,
    description: promo.description,
    isActive: promo.isActive,
    createdAt: promo.createdAt?.toISOString().split("T")[0]
  }));

  return SendResponse.success({
    res,
    message: "Promotions fetched successfully",
    data: {
      items: promotionsFormatted,
      currentPage: page,
      limit,
      totalItems: totalPromotions,
      totalPages,
      hasNext
    }
  });
}

export async function getSinglePromotionHandler(req: Request, res: Response) {
  const functionName = getSinglePromotionHandler.name;
  const { promotionId } = req.params;

  const promotion = await PromotionModel.findById(promotionId).lean();

  if (!promotion) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Promotion not found",
        DATA_NOT_FOUND,
        "Promotion with the given ID does not exist"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Promotion fetched successfully",
    data: {
      promotion: {
        id: promotion._id.toString(),
        title: promotion.title,
        description: promotion.description,
        bannerImage: promotion.bannerImage,
        buttonText: promotion.buttonText,
        buttonLink: promotion.buttonLink,
        isActive: promotion.isActive,
        titleColor: promotion.titleColor,
        descriptionColor: promotion.descriptionColor,
        buttonBgColor: promotion.buttonBgColor,
        buttonTextColor: promotion.buttonTextColor,
        createdAt: promotion.createdAt?.toISOString().split("T")[0]
      }
    }
  });
}

export async function updatePromotionHandler(
  req: Request<Record<string, never>, Record<string, never>, CreatePromotionType>,
  res: Response
) {
  const functionName = updatePromotionHandler.name;
  const { promotionId } = req.params;
  const {
    title,
    description,
    bannerImage,
    buttonText,
    buttonLink,
    isActive,
    titleColor,
    descriptionColor,
    buttonBgColor,
    buttonTextColor
  } = req.body;

  const promotion = await PromotionModel.findById(promotionId);

  if (!promotion) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Promotion not found",
        DATA_NOT_FOUND,
        "Promotion with the given ID does not exist"
      )
    });
  }

  promotion.title = title ? title.trim() : promotion.title;
  promotion.description = description ? description.trim() : promotion.description;
  promotion.bannerImage = bannerImage ? bannerImage.trim() : promotion.bannerImage;
  promotion.buttonText = buttonText ? buttonText.trim() : promotion.buttonText;
  promotion.buttonLink = buttonLink ? buttonLink.trim() : promotion.buttonLink;
  promotion.titleColor = titleColor ? titleColor.trim() : promotion.titleColor;
  promotion.descriptionColor = descriptionColor ? descriptionColor.trim() : promotion.descriptionColor;
  promotion.buttonBgColor = buttonBgColor ? buttonBgColor.trim() : promotion.buttonBgColor;
  promotion.buttonTextColor = buttonTextColor ? buttonTextColor.trim() : promotion.buttonTextColor;
  promotion.isActive = isActive ?? false;

  await promotion.save();

  return SendResponse.success({
    res,
    message: "Promotion updated successfully",
    data: {
      promotion: {
        id: promotion._id.toString()
      }
    }
  });
}

export async function togglePromotionStatusHandler(req: Request, res: Response) {
  const functionName = togglePromotionStatusHandler.name;
  const { promotionId } = req.params;

  const promotion = await PromotionModel.findById(promotionId);

  if (!promotion) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Promotion not found",
        DATA_NOT_FOUND,
        "Promotion with the given ID does not exist"
      )
    });
  }

  promotion.isActive = !promotion.isActive;
  await promotion.save();

  return SendResponse.success({
    res,
    message: "Promotion status toggled successfully",
    data: {
      promotion: {
        id: promotion._id.toString(),
        isActive: promotion.isActive
      }
    }
  });
}

export async function deletePromotionHandler(req: Request, res: Response) {
  const functionName = deletePromotionHandler.name;
  const { promotionId } = req.params;

  const promotion = await PromotionModel.findById(promotionId);
  if (!promotion) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Promotion not found",
        DATA_NOT_FOUND,
        "Promotion with the given ID does not exist"
      )
    });
  }

  await PromotionModel.findByIdAndDelete(promotionId);

  return SendResponse.success({
    res,
    message: "Promotion deleted successfully",
    data: null
  });
}
