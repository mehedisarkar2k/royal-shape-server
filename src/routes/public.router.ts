// * for website mainly

import { Router } from "express";
import {
  applyToCareerPostHandler,
  getSingleCareerPostPublicDataHandler,
  getWebsiteAboutPageDataHandler,
  getWebsiteCareersPageDataHandler,
  getWebsiteFooterPublicDataHandler,
  getWebsiteHomePublicDataHandler,
  getWebsitePricingPageDataHandler,
  getWebsiteServicesPageDataHandler,
  uploadJobDocumentHandler
} from "../controllers";
import { asyncWrapper } from "../utils";
import { validateResource } from "../middleware";
import { applyCareerPostSchema } from "../schemas";
import upload from "../utils/multer";

const router = Router();

router.get("/website/home", asyncWrapper(getWebsiteHomePublicDataHandler));
router.get("/website/footer", asyncWrapper(getWebsiteFooterPublicDataHandler));
router.get("/website/services-page", asyncWrapper(getWebsiteServicesPageDataHandler));
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

export default router;
