import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
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

router.post("/create", requireUser, validateResource(createComboSchema), asyncWrapper(createComboHandler));
router.get("/all", asyncWrapper(getAllCombosHandler));
router.get("/single/:comboId", requireUser, asyncWrapper(getSingleComboHandler));
router.put("/update/:comboId", requireUser, validateResource(createComboSchema), asyncWrapper(updateComboHandler));
router.delete("/delete/:comboId", requireUser, asyncWrapper(deleteComboHandler));

export default router;
