import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import { asyncWrapper } from "../utils";
import { contactFormSubmitSchema, submitReviewSchema } from "../schemas";
import {
  askForReviewHandler,
  contactFormSubmitHandler,
  deleteContactSubmissionHandler,
  deleteReviewHandler,
  getAllContactFormSubmissionsHandler,
  getAllCustomerReviewsHandler,
  getAllPublicCustomerReviewsHandler,
  markContactSubmissionReadUnreadHandler,
  submitReviewHandler,
  toggleReviewStatusHandler
} from "../controllers";

const router = Router();

router.post("/public/submit/review", validateResource(submitReviewSchema), asyncWrapper(submitReviewHandler));
router.get("/customer-reviews", requireUser, asyncWrapper(getAllCustomerReviewsHandler));
router.get("/public/customer-reviews", asyncWrapper(getAllPublicCustomerReviewsHandler));
router.put("/toggle-review-status/:reviewId", requireUser, asyncWrapper(toggleReviewStatusHandler));
router.delete("/delete-review/:reviewId", requireUser, asyncWrapper(deleteReviewHandler));

router.post(
  "/public/submit/contact-form",
  validateResource(contactFormSubmitSchema),
  asyncWrapper(contactFormSubmitHandler)
);
router.get("/contact-form-submissions", requireUser, asyncWrapper(getAllContactFormSubmissionsHandler));
router.put(
  "/mark-contact-submission-read-unread/:contactSubmissionId",
  requireUser,
  asyncWrapper(markContactSubmissionReadUnreadHandler)
);
router.delete(
  "/delete-contact-submission/:contactSubmissionId",
  requireUser,
  asyncWrapper(deleteContactSubmissionHandler)
);
router.post("/ask-for-review", requireUser, asyncWrapper(askForReviewHandler));

export default router;
