import { Router } from "express";
import { requireUser } from "../middleware";
import { asyncWrapper } from "../utils";
import upload from "../utils/multer";
import { uploadImageHandler } from "../controllers";

const router = Router();

router.post("/upload-image", requireUser, upload.single("document"), asyncWrapper(uploadImageHandler));

export default router;
