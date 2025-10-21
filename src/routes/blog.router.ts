import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
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

router.post("/create", requireUser, validateResource(createBlogSchema), asyncWrapper(createBlogHandler));
router.get("/all", requireUser, asyncWrapper(getAllBlogsHandler));
router.get("/single/:blogId", requireUser, asyncWrapper(getSingleBlogHandler));
router.put("/edit/:blogId", requireUser, asyncWrapper(editBlogHandler));
router.delete("/delete/:blogId", requireUser, asyncWrapper(deleteBlogHandler));
router.put("/toggle-status/:blogId", requireUser, asyncWrapper(toggleBlogStatusHandler));
router.get("/public/all", asyncWrapper(getAllPublicBlogsHandler));
router.get("/public/single/:blogId", asyncWrapper(getSinglePublicBlogHandler));

export default router;
