import { Router } from "express";
import { requireUser, requireRole, validateResource } from "../middleware";
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
router.get("/customer-reviews", requireUser, requireRole("admin"), asyncWrapper(getAllCustomerReviewsHandler));
router.get("/public/customer-reviews", asyncWrapper(getAllPublicCustomerReviewsHandler));
router.put(
  "/toggle-review-status/:reviewId",
  requireUser,
  requireRole("admin"),
  asyncWrapper(toggleReviewStatusHandler)
);
router.delete("/delete-review/:reviewId", requireUser, requireRole("admin"), asyncWrapper(deleteReviewHandler));

router.post(
  "/public/submit/contact-form",
  validateResource(contactFormSubmitSchema),
  asyncWrapper(contactFormSubmitHandler)
);
router.get(
  "/contact-form-submissions",
  requireUser,
  requireRole("admin"),
  asyncWrapper(getAllContactFormSubmissionsHandler)
);
router.put(
  "/mark-contact-submission-read-unread/:contactSubmissionId",
  requireUser,
  requireRole("admin"),
  asyncWrapper(markContactSubmissionReadUnreadHandler)
);
router.delete(
  "/delete-contact-submission/:contactSubmissionId",
  requireUser,
  requireRole("admin"),
  asyncWrapper(deleteContactSubmissionHandler)
);
router.post("/ask-for-review", requireUser, requireRole("admin"), asyncWrapper(askForReviewHandler));

export default router;
