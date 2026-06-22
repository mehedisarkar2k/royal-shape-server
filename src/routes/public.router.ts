// * for website mainly

import { Router } from "express";
import {
  applyToCareerPostHandler,
  contactFormSubmitHandler,
  getAllPublishedBlogsHandler,
  getBlogCategoriesAndTagsHandler,
  getSingleCareerPostPublicDataHandler,
  getSinglePublishedBlogHandler,
  getWebsiteAboutPageDataHandler,
  getWebsiteBranchesPublicDataHandler,
  getWebsiteBranchServicesPublicDataHandler,
  getWebsiteCareersPageDataHandler,
  getWebsiteContactPageDataHandler,
  getWebsiteFooterPublicDataHandler,
  getWebsiteHomePublicDataHandler,
  getWebsitePricingPageDataHandler,
  getWebsiteServicesPageDataHandler,
  getWebsiteSingleServicePageDataHandler,
  submitReviewPublicHandler,
  uploadJobDocumentHandler,
  getPublicGoogleReviewsHandler
} from "../controllers";
import { asyncWrapper } from "../utils";
import { validateResource } from "../middleware";
import { applyCareerPostSchema, contactFormSubmitSchema, submitReviewSchema } from "../schemas";
import upload from "../utils/multer";

const router = Router();

router.get("/website/home", asyncWrapper(getWebsiteHomePublicDataHandler));
router.get("/website/footer", asyncWrapper(getWebsiteFooterPublicDataHandler));
router.get("/website/services-page", asyncWrapper(getWebsiteServicesPageDataHandler));
router.get("/website/services-page/single-service/:serviceId", asyncWrapper(getWebsiteSingleServicePageDataHandler));
router.get("/website/pricing-page", asyncWrapper(getWebsitePricingPageDataHandler));
router.get("/website/about-page", asyncWrapper(getWebsiteAboutPageDataHandler));
router.get("/website/careers-page", asyncWrapper(getWebsiteCareersPageDataHandler));
router.get("/website/careers-page/single-post/:careerId", asyncWrapper(getSingleCareerPostPublicDataHandler));
router.post("/website/upload/job-document", upload.single("jobDocument"), asyncWrapper(uploadJobDocumentHandler));
router.post(
  "/website/careers/apply/:careerId",
  validateResource(applyCareerPostSchema),
  asyncWrapper(applyToCareerPostHandler)
);
router.get("/website/contact-page", asyncWrapper(getWebsiteContactPageDataHandler));
router.post(
  "/website/submit/contact-form",
  validateResource(contactFormSubmitSchema),
  asyncWrapper(contactFormSubmitHandler)
);
router.get("/website/branches-info", asyncWrapper(getWebsiteBranchesPublicDataHandler));
router.get("/website/branch/services-info/:branchId", asyncWrapper(getWebsiteBranchServicesPublicDataHandler));
router.get("/website/blog/categories-and-tags", asyncWrapper(getBlogCategoriesAndTagsHandler));
router.get("/website/blog/all", asyncWrapper(getAllPublishedBlogsHandler));
router.get("/website/blog/single/:blogId", asyncWrapper(getSinglePublishedBlogHandler));
router.post("/submit-review", validateResource(submitReviewSchema), asyncWrapper(submitReviewPublicHandler));
router.get("/google-reviews", asyncWrapper(getPublicGoogleReviewsHandler));

export default router;
