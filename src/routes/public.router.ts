// * for website mainly

import { Router } from "express";
import {
  getWebsiteAboutPageDataHandler,
  getWebsiteFooterPublicDataHandler,
  getWebsiteHomePublicDataHandler,
  getWebsitePricingPageDataHandler,
  getWebsiteServicesPageDataHandler
} from "../controllers";
import { asyncWrapper } from "../utils";

const router = Router();

router.get("/website/home", asyncWrapper(getWebsiteHomePublicDataHandler));
router.get("/website/footer", asyncWrapper(getWebsiteFooterPublicDataHandler));
router.get("/website/services-page", asyncWrapper(getWebsiteServicesPageDataHandler));
router.get("/website/pricing-page", asyncWrapper(getWebsitePricingPageDataHandler));
router.get("/website/about-page", asyncWrapper(getWebsiteAboutPageDataHandler));

export default router;
