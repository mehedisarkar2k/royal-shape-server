import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
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

router.post("/create", requireUser, validateResource(createPromotionSchema), asyncWrapper(createPromotionHandler));
router.get("/all", requireUser, asyncWrapper(getAllPromotionsHandler));
router.get("/single/:promotionId", requireUser, asyncWrapper(getSinglePromotionHandler));
router.put(
  "/update/:promotionId",
  requireUser,
  validateResource(createPromotionSchema),
  asyncWrapper(updatePromotionHandler)
);
router.put("/toggle-status/:promotionId", requireUser, asyncWrapper(togglePromotionStatusHandler));
router.delete("/delete/:promotionId", requireUser, asyncWrapper(deletePromotionHandler));

export default router;
