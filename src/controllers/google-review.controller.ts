import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { ApplicationServices, DATA_NOT_FOUND, UNEXPECTED_ERROR } from "../constants";
import { SendErrorResponse, SendResponse } from "../utils";
import { DocumentType } from "@typegoose/typegoose";
import { GoogleReview, GoogleReviewModel } from "../model";
import { deleteGoogleReviewReply, listGoogleLocations, replyToGoogleReview, syncGoogleReviews } from "../services";

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
    service: ApplicationServices.ENGAGEMENT,
    id: uuid()
  }
});

const toClient = (r: DocumentType<GoogleReview>) => ({
  id: r._id.toString(),
  branchId: r.branchId,
  reviewerName: r.reviewerName,
  reviewerPhoto: r.reviewerPhoto,
  rating: r.starRating,
  comment: r.comment,
  reply: r.reply ? { comment: r.reply.comment, updateTime: r.reply.updateTime } : null,
  showInWebsite: r.showInWebsite,
  isHidden: r.isHidden,
  reviewCreateTime: r.reviewCreateTime
});

/** Admin: pull latest reviews from Google into the DB. */
export async function syncGoogleReviewsHandler(req: Request, res: Response) {
  const functionName = syncGoogleReviewsHandler.name;
  try {
    const summary = await syncGoogleReviews();
    return SendResponse.success({ res, message: "Google reviews synced successfully", data: { summary } });
  } catch (error) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to sync Google reviews",
        UNEXPECTED_ERROR,
        (error as Error).message
      )
    });
  }
}

/** Admin: helper to discover Google location names → titles for branch mapping. */
export async function listGoogleLocationsHandler(req: Request, res: Response) {
  const functionName = listGoogleLocationsHandler.name;
  try {
    const locations = await listGoogleLocations();
    return SendResponse.success({ res, message: "Google locations fetched", data: { locations } });
  } catch (error) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to fetch Google locations",
        UNEXPECTED_ERROR,
        (error as Error).message
      )
    });
  }
}

/** Admin: list synced reviews (non-hidden), with optional branch filter + sort. */
export async function getAllGoogleReviewsHandler(req: Request, res: Response) {
  const branchId = (req.query.branchId as string)?.trim();
  const sort = (req.query.sort as string)?.trim();

  const query: Record<string, unknown> = { isHidden: false };
  if (branchId) query.branchId = branchId;

  // sort options: newest (default) | oldest | rating_desc | rating_asc
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { reviewCreateTime: -1 },
    oldest: { reviewCreateTime: 1 },
    rating_desc: { starRating: -1, reviewCreateTime: -1 },
    rating_asc: { starRating: 1, reviewCreateTime: -1 }
  };
  const sortBy = sortMap[sort] || sortMap.newest;

  const reviews = await GoogleReviewModel.find(query).sort(sortBy);
  return SendResponse.success({
    res,
    message: "Google reviews fetched",
    data: { items: reviews.map(toClient) }
  });
}

const findOr404 = async (req: Request, res: Response, functionName: string) => {
  const review = await GoogleReviewModel.findById(req.params.reviewId);
  if (!review) {
    SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Review not found",
        DATA_NOT_FOUND,
        "Review not found"
      )
    });
    return null;
  }
  return review;
};

/** Admin: toggle whether a review shows on the public website. */
export async function toggleGoogleReviewPublishHandler(req: Request, res: Response) {
  const review = await findOr404(req, res, toggleGoogleReviewPublishHandler.name);
  if (!review) return;

  review.showInWebsite = !review.showInWebsite;
  await review.save();
  return SendResponse.success({ res, message: "Review visibility updated", data: toClient(review) });
}

/** Admin: hide a review from the dashboard/website (cannot delete from Google). */
export async function hideGoogleReviewHandler(req: Request, res: Response) {
  const review = await findOr404(req, res, hideGoogleReviewHandler.name);
  if (!review) return;

  review.isHidden = true;
  review.showInWebsite = false;
  await review.save();
  return SendResponse.success({ res, message: "Review hidden", data: { id: review._id.toString() } });
}

/** Admin: post/update a reply (pushes to Google). */
export async function replyGoogleReviewHandler(req: Request, res: Response) {
  const functionName = replyGoogleReviewHandler.name;
  const { comment } = req.body;
  if (!comment || !comment.trim()) {
    return SendErrorResponse.badRequest({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Reply text is required",
        DATA_NOT_FOUND,
        "Reply text is required"
      )
    });
  }
  try {
    const review = await replyToGoogleReview(req.params.reviewId, comment.trim());
    return SendResponse.success({ res, message: "Reply posted to Google", data: toClient(review) });
  } catch (error) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to post reply",
        UNEXPECTED_ERROR,
        (error as Error).message
      )
    });
  }
}

/** Admin: delete the reply (removes from Google). */
export async function deleteGoogleReviewReplyHandler(req: Request, res: Response) {
  const functionName = deleteGoogleReviewReplyHandler.name;
  try {
    const review = await deleteGoogleReviewReply(req.params.reviewId);
    return SendResponse.success({ res, message: "Reply deleted", data: toClient(review) });
  } catch (error) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to delete reply",
        UNEXPECTED_ERROR,
        (error as Error).message
      )
    });
  }
}

/** Public: published Google reviews for the website. */
export async function getPublicGoogleReviewsHandler(req: Request, res: Response) {
  const reviews = await GoogleReviewModel.find({ showInWebsite: true, isHidden: false })
    .sort({ starRating: -1, reviewCreateTime: -1 })
    .limit(20);

  return SendResponse.success({
    res,
    message: "Published Google reviews fetched",
    data: {
      items: reviews.map((r) => ({
        id: r._id.toString(),
        reviewerName: r.reviewerName,
        reviewerPhoto: r.reviewerPhoto,
        rating: r.starRating,
        comment: r.comment,
        reply: r.reply ? { comment: r.reply.comment } : null,
        reviewCreateTime: r.reviewCreateTime
      }))
    }
  });
}
