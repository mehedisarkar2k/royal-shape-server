import { Router } from "express";
import { requireUser } from "../middleware";
import { asyncWrapper } from "../utils";
import upload from "../utils/multer";
import { uploadImageHandler, uploadWebsiteImageHandler } from "../controllers";

const router = Router();

router.post("/upload-image", requireUser, upload.single("image"), asyncWrapper(uploadImageHandler));
router.post("/upload-website-image", requireUser, upload.single("image"), asyncWrapper(uploadWebsiteImageHandler));

export default router;
