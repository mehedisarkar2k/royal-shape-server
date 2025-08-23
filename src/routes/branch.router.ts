import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import { createBranchSchema } from "../schemas";
import {
  createBranchHandler,
  deleteBranchHandler,
  getAllBranchesHandler,
  getBranchByIdHandler,
  updateBranchHandler
} from "../controllers";
import { asyncWrapper } from "../utils";

const router = Router();

router.post("/create", requireUser, validateResource(createBranchSchema), asyncWrapper(createBranchHandler));
router.get("/all", requireUser, asyncWrapper(getAllBranchesHandler));
router.get("/single/:id", requireUser, asyncWrapper(getBranchByIdHandler));
router.put("/update/:id", requireUser, validateResource(createBranchSchema), asyncWrapper(updateBranchHandler));
router.delete("/delete/:id", requireUser, asyncWrapper(deleteBranchHandler));

export default router;
