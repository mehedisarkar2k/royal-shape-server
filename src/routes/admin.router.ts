import { Router } from "express";
import { requireUser, requireRole, validateResource } from "../middleware";
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
import { getAdminSettingsHandler, postAdminSettingsHandler } from "../controllers";

const router = Router();

router.post(
  "/business-info/init",
  requireUser,
  requireRole("admin"),
  asyncWrapper(createBusinessInfoDocumentIfNotExists)
);

router.get("/website/home", requireUser, requireRole("admin"), asyncWrapper(getWebsiteHomeDataHandler));
router.post(
  "/website/home",
  requireUser,
  requireRole("admin"),
  validateResource(postWebsiteHomeDataSchema),
  asyncWrapper(postWebsiteHomeDataHandler)
);

router.get(
  "/website/service/:serviceCategoryId",
  requireUser,
  requireRole("admin"),
  asyncWrapper(getWebsiteServiceDataHandler)
);
router.post(
  "/website/service/:serviceCategoryId",
  requireUser,
  requireRole("admin"),
  validateResource(postWebsiteServiceDataSchema),
  asyncWrapper(postWebsiteServiceDataHandler)
);

router.get("/website/about", requireUser, requireRole("admin"), asyncWrapper(getWebsiteAboutDataHandler));
router.post(
  "/website/about",
  requireUser,
  requireRole("admin"),
  validateResource(postWebsiteAboutDataSchema),
  asyncWrapper(postWebsiteAboutDataHandler)
);

router.get("/general-settings", requireUser, requireRole("admin"), asyncWrapper(getGeneralSettingsDataHandler));
router.post(
  "/general-settings",
  requireUser,
  requireRole("admin"),
  validateResource(postGeneralSettingsDataSchema),
  asyncWrapper(postGeneralSettingsDataHandler)
);

router.get("/social-links", requireUser, requireRole("admin"), asyncWrapper(getSocialLinksDataHandler));
router.post(
  "/social-links",
  requireUser,
  requireRole("admin"),
  validateResource(postSocialMediaLinksDataSchema),
  asyncWrapper(postSocialLinksDataHandler)
);

router.get("/dashboard/overview", requireUser, requireRole("admin"), asyncWrapper(getDashboardOverviewDataHandler));

router.get("/website/showcase/all", requireUser, requireRole("admin"), asyncWrapper(getAllWebsiteShowcaseHandler));
router.post(
  "/website/showcase/add",
  requireUser,
  requireRole("admin"),
  validateResource(addWebsiteShowcaseSchema),
  asyncWrapper(addWebsiteShowcaseHandler)
);
router.delete(
  "/website/showcase/delete/:showcaseId",
  requireUser,
  requireRole("admin"),
  asyncWrapper(deleteWebsiteShowcaseHandler)
);

// Admin Settings
router.get("/settings", requireUser, requireRole("admin"), asyncWrapper(getAdminSettingsHandler));
router.post("/settings", requireUser, requireRole("admin"), asyncWrapper(postAdminSettingsHandler));

export default router;
