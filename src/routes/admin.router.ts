import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import {
  createBusinessInfoDocumentIfNotExists,
  getWebsiteAboutDataHandler,
  getWebsiteHomeDataHandler,
  getWebsiteServiceDataHandler,
  postWebsiteAboutDataHandler,
  postWebsiteHomeDataHandler,
  postWebsiteServiceDataHandler
} from "../controllers";
import { asyncWrapper } from "../utils";
import { postWebsiteAboutDataSchema, postWebsiteHomeDataSchema, postWebsiteServiceDataSchema } from "../schemas";

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

export default router;
