import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import {
  addWebsiteShowcaseHandler,
  createBusinessInfoDocumentIfNotExists,
  deleteWebsiteShowcaseHandler,
  getAllWebsiteShowcaseHandler,
  getDashboardOverviewDataHandler,
  getGeneralSettingsDataHandler,
  getSocialLinksDataHandler,
  getWebsiteAboutDataHandler,
  getWebsiteHomeDataHandler,
  getWebsiteServiceDataHandler,
  postGeneralSettingsDataHandler,
  postSocialLinksDataHandler,
  postWebsiteAboutDataHandler,
  postWebsiteHomeDataHandler,
  postWebsiteServiceDataHandler
} from "../controllers";
import { asyncWrapper } from "../utils";
import {
  addWebsiteShowcaseSchema,
  postGeneralSettingsDataSchema,
  postSocialMediaLinksDataSchema,
  postWebsiteAboutDataSchema,
  postWebsiteHomeDataSchema,
  postWebsiteServiceDataSchema
} from "../schemas";

const router = Router();

router.post("/business-info/init", asyncWrapper(createBusinessInfoDocumentIfNotExists));

router.get("/website/home", requireUser, asyncWrapper(getWebsiteHomeDataHandler));
router.post(
  "/website/home",
  requireUser,
  validateResource(postWebsiteHomeDataSchema),
  asyncWrapper(postWebsiteHomeDataHandler)
);

router.get("/website/service/:serviceCategoryId", requireUser, asyncWrapper(getWebsiteServiceDataHandler));
router.post(
  "/website/service/:serviceCategoryId",
  requireUser,
  validateResource(postWebsiteServiceDataSchema),
  asyncWrapper(postWebsiteServiceDataHandler)
);

router.get("/website/about", asyncWrapper(getWebsiteAboutDataHandler));
router.post(
  "/website/about",
  requireUser,
  validateResource(postWebsiteAboutDataSchema),
  asyncWrapper(postWebsiteAboutDataHandler)
);

router.get("/general-settings", requireUser, asyncWrapper(getGeneralSettingsDataHandler));
router.post(
  "/general-settings",
  requireUser,
  validateResource(postGeneralSettingsDataSchema),
  asyncWrapper(postGeneralSettingsDataHandler)
);

router.get("/social-links", requireUser, asyncWrapper(getSocialLinksDataHandler));
router.post(
  "/social-links",
  requireUser,
  validateResource(postSocialMediaLinksDataSchema),
  asyncWrapper(postSocialLinksDataHandler)
);

router.get("/dashboard/overview", requireUser, asyncWrapper(getDashboardOverviewDataHandler));

router.get("/website/showcase/all", requireUser, asyncWrapper(getAllWebsiteShowcaseHandler));
router.post(
  "/website/showcase/add",
  requireUser,
  validateResource(addWebsiteShowcaseSchema),
  asyncWrapper(addWebsiteShowcaseHandler)
);
router.delete("/website/showcase/delete/:showcaseId", requireUser, asyncWrapper(deleteWebsiteShowcaseHandler));
export default router;
