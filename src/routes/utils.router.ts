import { Router } from "express";
import { requireUser } from "../middleware";
import { asyncWrapper } from "../utils";
import upload from "../utils/multer";
import { uploadImageHandler, uploadPublicWebsiteImageHandler, uploadWebsiteImageHandler } from "../controllers";

const router = Router();

router.post("/upload-image", requireUser, upload.single("image"), asyncWrapper(uploadImageHandler));
router.post("/upload-website-image", requireUser, upload.single("image"), asyncWrapper(uploadWebsiteImageHandler));
router.post("/upload-website-image/public", upload.single("image"), asyncWrapper(uploadPublicWebsiteImageHandler));

export default router;
