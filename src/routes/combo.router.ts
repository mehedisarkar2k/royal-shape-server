import { Router } from "express";
import { requireUser, requireRole, validateResource } from "../middleware";
import { asyncWrapper } from "../utils";
import {
  createComboHandler,
  deleteComboHandler,
  getAllCombosHandler,
  getSingleComboHandler,
  updateComboHandler
} from "../controllers";
import { createComboSchema } from "../schemas";

const router = Router();

router.post(
  "/create",
  requireUser,
  requireRole("admin"),
  validateResource(createComboSchema),
  asyncWrapper(createComboHandler)
);
router.get("/all", asyncWrapper(getAllCombosHandler));
router.get("/single/:comboId", requireUser, requireRole("admin"), asyncWrapper(getSingleComboHandler));
router.put(
  "/update/:comboId",
  requireUser,
  requireRole("admin"),
  validateResource(createComboSchema),
  asyncWrapper(updateComboHandler)
);
router.delete("/delete/:comboId", requireUser, requireRole("admin"), asyncWrapper(deleteComboHandler));

export default router;
