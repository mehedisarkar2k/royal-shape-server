import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import {
  addJobPostingHandler,
  closeJobPostingHandler,
  deleteJobPostingHandler,
  getAllJobPostingsHandler,
  getJobPostApplicationsHandler,
  getSingleJobPostingHandler,
  updateJobPostingHandler
} from "../controllers";
import { asyncWrapper } from "../utils";
import { addJobPostingSchema } from "../schemas";

const router = Router();

router.post("/create", requireUser, validateResource(addJobPostingSchema), asyncWrapper(addJobPostingHandler));
router.get("/all", requireUser, asyncWrapper(getAllJobPostingsHandler));
router.get("/single/:id", requireUser, asyncWrapper(getSingleJobPostingHandler));
router.get("/applications/:jobPostId", requireUser, asyncWrapper(getJobPostApplicationsHandler));
router.put("/update/:id", requireUser, validateResource(addJobPostingSchema), asyncWrapper(updateJobPostingHandler));
router.delete("/delete/:id", requireUser, asyncWrapper(deleteJobPostingHandler));
router.put("/close/:id", requireUser, asyncWrapper(closeJobPostingHandler));

// TODO: add routes for applying to a job post.

export default router;
