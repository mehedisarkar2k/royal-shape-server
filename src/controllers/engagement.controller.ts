import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { ContactFormSubmitType, SubmitReviewInput } from "../schemas";
import { ReviewModel } from "../model/review.model";
import { ApplicationServices, UNEXPECTED_ERROR } from "../constants";
import { sendContactUsEmail, SendErrorResponse, SendResponse } from "../utils";
import { createContact } from "../services";
import { ContactFormSubmissionModel } from "../model";

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

export async function submitReviewHandler(
  req: Request<Record<string, never>, Record<string, never>, SubmitReviewInput>,
  res: Response
) {
  const functionName = submitReviewHandler.name;
  const data = req.body;

  const newReview = await ReviewModel.create({
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    rating: data.rating,
    comment: data.comment,
    showInWebsite: false
  });

  if (!newReview) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to submit review",
        UNEXPECTED_ERROR,
        "Something went wrong while submitting your review. Please try again later."
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Review submitted successfully",
    data: null
  });
}

export async function getAllCustomerReviewsHandler(req: Request, res: Response) {
  // const functionName = getAllCustomerReviewsHandler.name;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const skip = (page - 1) * limit;

  const reviews = await ReviewModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await ReviewModel.countDocuments({});

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;

  return SendResponse.success({
    res,
    message: "Reviews fetched successfully",
    data: {
      items: reviews.map((review) => ({
        id: review._id.toString(),
        customerName: review.customerName,
        customerEmail: review.customerEmail,
        rating: review.rating,
        comment: review.comment,
        showInWebsite: review.showInWebsite,
        createdAt: review.createdAt
      })),
      currentPage: page,
      limit,
      totalItems: total,
      totalPages,
      hasNext
    }
  });
}

export async function getAllPublicCustomerReviewsHandler(req: Request, res: Response) {
  // const functionName = getAllPublicCustomerReviewsHandler.name;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const skip = (page - 1) * limit;

  const reviews = await ReviewModel.find({ showInWebsite: true }).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await ReviewModel.countDocuments({ showInWebsite: true });

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;

  return SendResponse.success({
    res,
    message: "Public reviews fetched successfully",
    data: {
      items: reviews.map((review) => ({
        id: review._id.toString(),
        customerName: review.customerName,
        rating: review.rating,
        comment: review.comment
      })),
      currentPage: page,
      limit,
      totalItems: total,
      totalPages,
      hasNext
    }
  });
}

export async function toggleReviewStatusHandler(req: Request, res: Response) {
  const functionName = toggleReviewStatusHandler.name;
  const { reviewId } = req.params;

  const review = await ReviewModel.findById(reviewId);
  if (!review) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Review not found",
        UNEXPECTED_ERROR,
        "The review you are trying to update does not exist."
      )
    });
  }

  review.showInWebsite = !review.showInWebsite;
  await review.save();

  return SendResponse.success({
    res,
    message: "Review status updated successfully",
    data: null
  });
}

export async function deleteReviewHandler(req: Request, res: Response) {
  const functionName = deleteReviewHandler.name;
  const { reviewId } = req.params;

  const review = await ReviewModel.findById(reviewId);
  if (!review) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Review not found",
        UNEXPECTED_ERROR,
        "The review you are trying to delete does not exist."
      )
    });
  }

  await ReviewModel.findByIdAndDelete(reviewId);

  return SendResponse.success({
    res,
    message: "Review deleted successfully",
    data: null
  });
}

export async function contactFormSubmitHandler(
  req: Request<Record<string, never>, Record<string, never>, ContactFormSubmitType>,
  res: Response
) {
  const data = req.body;
  const contact = await createContact({
    name: data.name,
    email: data.email,
    topic: data.topic,
    message: data.message,
    isRead: false
  });
  try {
    await sendContactUsEmail(data);
  } catch (error) {
    console.error("Error sending contact us email:", (error as Error).message);
  }
  console.log("Contact form submitted:", contact);
  return SendResponse.success({
    res,
    message: "Submitted contact form successfully",
    data: {
      contact: { id: contact._id.toString() }
    }
  });
}

export async function getAllContactFormSubmissionsHandler(req: Request, res: Response) {
  // const functionName = getAllContactFormSubmissionsHandler.name;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const skip = (page - 1) * limit;

  const contactFormSubmissions = await ContactFormSubmissionModel.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await ContactFormSubmissionModel.countDocuments({});

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;

  return SendResponse.success({
    res,
    message: "Contact form submissions fetched successfully",
    data: {
      items: contactFormSubmissions.map((submission) => ({
        id: submission._id.toString(),
        name: submission.name,
        email: submission.email,
        topic: submission.topic,
        message: submission.message,
        isRead: submission.isRead,
        submittedAt: submission.createdAt
      })),
      currentPage: page,
      limit,
      totalItems: total,
      totalPages,
      hasNext
    }
  });
}

export async function markContactSubmissionReadUnreadHandler(req: Request, res: Response) {
  const functionName = markContactSubmissionReadUnreadHandler.name;
  const { contactSubmissionId } = req.params;

  const contactSubmission = await ContactFormSubmissionModel.findById(contactSubmissionId);
  if (!contactSubmission) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Contact form submission not found",
        UNEXPECTED_ERROR,
        "The contact form submission you are trying to update does not exist."
      )
    });
  }

  contactSubmission.isRead = !contactSubmission.isRead;
  await contactSubmission.save();

  return SendResponse.success({
    res,
    message: "Contact form submission status updated successfully",
    data: null
  });
}

export async function deleteContactSubmissionHandler(req: Request, res: Response) {
  const functionName = deleteContactSubmissionHandler.name;
  const { contactSubmissionId } = req.params;

  const contactSubmission = await ContactFormSubmissionModel.findById(contactSubmissionId);
  if (!contactSubmission) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Contact form submission not found",
        UNEXPECTED_ERROR,
        "The contact form submission you are trying to delete does not exist."
      )
    });
  }

  await ContactFormSubmissionModel.findByIdAndDelete(contactSubmissionId);

  return SendResponse.success({
    res,
    message: "Contact form submission deleted successfully",
    data: null
  });
}
