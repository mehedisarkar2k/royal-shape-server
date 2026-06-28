import { Router } from "express";
import { requireUser, requireRole, validateResource } from "../middleware";
import { createBranchSchema } from "../schemas";
import {
  createBranchHandler,
  deleteBranchHandler,
  getAllBranchesHandler,
  getBranchByIdHandler,
  updateBranchHandler,
  uploadBranchImageHandler
} from "../controllers";
import { asyncWrapper } from "../utils";
import upload from "../utils/multer";

const router = Router();

router.post(
  "/create",
  requireUser,
  requireRole("admin"),
  validateResource(createBranchSchema),
  asyncWrapper(createBranchHandler)
);
router.get("/all", requireUser, requireRole("admin"), asyncWrapper(getAllBranchesHandler));
router.get("/single/:id", requireUser, requireRole("admin"), asyncWrapper(getBranchByIdHandler));
router.put(
  "/update/:id",
  requireUser,
  requireRole("admin"),
  validateResource(createBranchSchema),
  asyncWrapper(updateBranchHandler)
);
router.delete("/delete/:id", requireUser, requireRole("admin"), asyncWrapper(deleteBranchHandler));
router.post(
  "/upload/image",
  requireUser,
  requireRole("admin"),
  upload.single("branch-image"),
  asyncWrapper(uploadBranchImageHandler)
);

export default router;
