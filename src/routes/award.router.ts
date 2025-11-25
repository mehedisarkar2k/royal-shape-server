import { Router } from "express";
import { requireUser, validateResource } from "../middleware";
import { asyncWrapper } from "../utils";
import { createAwardSchema, updateAwardSchema } from "../schemas";
import {
  addAwardHandler,
  deleteAwardHandler,
  editAwardDetailsHandler,
  getAllAwardsHandler,
  getAllAwardsPublicHandler,
  getSingleAwardDetailsHandler,
  uploadAwardBannerImageHandler
} from "../controllers";
import upload from "../utils/multer";

const router = Router();

router
  .post("/create", requireUser, validateResource(createAwardSchema), asyncWrapper(addAwardHandler))
  .get("/all", requireUser, asyncWrapper(getAllAwardsHandler))
  .get("/single/:awardId", requireUser, asyncWrapper(getSingleAwardDetailsHandler))
  .put("/edit/:awardId", requireUser, validateResource(updateAwardSchema), asyncWrapper(editAwardDetailsHandler))
  .delete("/delete/:awardId", requireUser, asyncWrapper(deleteAwardHandler))
  .get("/public/all", asyncWrapper(getAllAwardsPublicHandler))
  .post("/upload/banner-image", requireUser, upload.single("award-image"), asyncWrapper(uploadAwardBannerImageHandler));

export default router;
