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
  toggleReviewStatusHandler,
  syncGoogleReviewsHandler,
  listGoogleLocationsHandler,
  getAllGoogleReviewsHandler,
  toggleGoogleReviewPublishHandler,
  hideGoogleReviewHandler,
  replyGoogleReviewHandler,
  deleteGoogleReviewReplyHandler
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

// --- Google reviews (admin) ---
router.post("/google-reviews/sync", requireUser, requireRole("admin"), asyncWrapper(syncGoogleReviewsHandler));
router.get("/google-reviews/locations", requireUser, requireRole("admin"), asyncWrapper(listGoogleLocationsHandler));
router.get("/google-reviews", requireUser, requireRole("admin"), asyncWrapper(getAllGoogleReviewsHandler));
router.put(
  "/google-reviews/toggle-publish/:reviewId",
  requireUser,
  requireRole("admin"),
  asyncWrapper(toggleGoogleReviewPublishHandler)
);
router.delete("/google-reviews/:reviewId", requireUser, requireRole("admin"), asyncWrapper(hideGoogleReviewHandler));
router.put(
  "/google-reviews/reply/:reviewId",
  requireUser,
  requireRole("admin"),
  asyncWrapper(replyGoogleReviewHandler)
);
router.delete(
  "/google-reviews/reply/:reviewId",
  requireUser,
  requireRole("admin"),
  asyncWrapper(deleteGoogleReviewReplyHandler)
);

export default router;
