import { Router } from "express";
import { requireUser, requireRole, validateResource } from "../middleware";
import { asyncWrapper } from "../utils";
import { createBlogSchema } from "../schemas";
import {
  createBlogHandler,
  deleteBlogHandler,
  editBlogHandler,
  getAllBlogsHandler,
  getAllPublicBlogsHandler,
  getSingleBlogHandler,
  getSinglePublicBlogHandler,
  toggleBlogStatusHandler
} from "../controllers";

const router = Router();

router.post(
  "/create",
  requireUser,
  requireRole("admin"),
  validateResource(createBlogSchema),
  asyncWrapper(createBlogHandler)
);
router.get("/all", requireUser, requireRole("admin"), asyncWrapper(getAllBlogsHandler));
router.get("/single/:blogId", requireUser, requireRole("admin"), asyncWrapper(getSingleBlogHandler));
router.put(
  "/edit/:blogId",
  validateResource(createBlogSchema),
  requireUser,
  requireRole("admin"),
  asyncWrapper(editBlogHandler)
);
router.delete("/delete/:blogId", requireUser, requireRole("admin"), asyncWrapper(deleteBlogHandler));
router.put("/toggle-status/:blogId", requireUser, requireRole("admin"), asyncWrapper(toggleBlogStatusHandler));
router.get("/public/all", asyncWrapper(getAllPublicBlogsHandler));
router.get("/public/single/:blogId", asyncWrapper(getSinglePublicBlogHandler));

export default router;
