import { Router } from "express";
import { requireUser, requireRole, validateResource } from "../middleware";
import {
  addJobPostingHandler,
  closeJobPostingHandler,
  deleteJobPostingHandler,
  getAllJobPostingsHandler,
  getAllPublicJobPostingsHandler,
  getJobPostApplicationsHandler,
  getSingleJobPostingHandler,
  getSinglePublicJobPostingHandler,
  updateJobPostingHandler
} from "../controllers";
import { asyncWrapper } from "../utils";
import { addJobPostingSchema } from "../schemas";

const router = Router();

router.post(
  "/create",
  requireUser,
  requireRole("admin"),
  validateResource(addJobPostingSchema),
  asyncWrapper(addJobPostingHandler)
);
router.get("/all", requireUser, requireRole("admin"), asyncWrapper(getAllJobPostingsHandler));
router.get("/single/:id", requireUser, requireRole("admin"), asyncWrapper(getSingleJobPostingHandler));
router.get("/applications/:jobPostId", requireUser, requireRole("admin"), asyncWrapper(getJobPostApplicationsHandler));
router.put(
  "/update/:id",
  requireUser,
  requireRole("admin"),
  validateResource(addJobPostingSchema),
  asyncWrapper(updateJobPostingHandler)
);
router.delete("/delete/:id", requireUser, requireRole("admin"), asyncWrapper(deleteJobPostingHandler));
router.put("/close/:id", requireUser, requireRole("admin"), asyncWrapper(closeJobPostingHandler));

router.get("/public/all", asyncWrapper(getAllPublicJobPostingsHandler));
router.get("/public/single/:id", asyncWrapper(getSinglePublicJobPostingHandler));

// TODO: add routes for applying to a job post.

export default router;
