import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import { addJobPostingHandler, getAllJobPostingsHandler } from "../controllers";
import { asyncWrapper } from "../utils";
import { addJobPostingSchema } from "../schemas";

const router = Router();

router.post("/create", requireUser, validateResource(addJobPostingSchema), asyncWrapper(addJobPostingHandler));
router.get("/all", requireUser, asyncWrapper(getAllJobPostingsHandler));

export default router;
