import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import { postWebsiteAboutDataHandler, postWebsiteHomeDataHandler, postWebsiteServiceDataHandler } from "../controllers";
import { asyncWrapper } from "../utils";
import { postWebsiteAboutDataSchema, postWebsiteHomeDataSchema, postWebsiteServiceDataSchema } from "../schemas";

const router = Router();

router.post(
  "/website/home",
  requireUser,
  validateResource(postWebsiteHomeDataSchema),
  asyncWrapper(postWebsiteHomeDataHandler)
);
router.post(
  "/website/service",
  requireUser,
  validateResource(postWebsiteServiceDataSchema),
  asyncWrapper(postWebsiteServiceDataHandler)
);
router.post(
  "/website/about",
  requireUser,
  validateResource(postWebsiteAboutDataSchema),
  asyncWrapper(postWebsiteAboutDataHandler)
);

export default router;
