import { Router } from "express";
import { requireUser, requireRole, validateResource } from "../middleware";
import { asyncWrapper } from "../utils";
import { createPromotionSchema } from "../schemas";
import {
  createPromotionHandler,
  deletePromotionHandler,
  getAllPromotionsHandler,
  getSinglePromotionHandler,
  togglePromotionStatusHandler,
  updatePromotionHandler
} from "../controllers";

const router = Router();

router.post(
  "/create",
  requireUser,
  requireRole("admin"),
  validateResource(createPromotionSchema),
  asyncWrapper(createPromotionHandler)
);
router.get("/all", requireUser, requireRole("admin"), asyncWrapper(getAllPromotionsHandler));
router.get("/single/:promotionId", requireUser, requireRole("admin"), asyncWrapper(getSinglePromotionHandler));
router.put(
  "/update/:promotionId",
  requireUser,
  requireRole("admin"),
  validateResource(createPromotionSchema),
  asyncWrapper(updatePromotionHandler)
);
router.put(
  "/toggle-status/:promotionId",
  requireUser,
  requireRole("admin"),
  asyncWrapper(togglePromotionStatusHandler)
);
router.delete("/delete/:promotionId", requireUser, requireRole("admin"), asyncWrapper(deletePromotionHandler));

export default router;
