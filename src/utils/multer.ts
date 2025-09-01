import multer from "multer";
import fs from "fs";
import { logger } from "./logger";

// In serverless environments (like Vercel), use /tmp directory
// In local development, use uploads directory
let UPLOADS_DIR = "uploads";

if (process.env.VERCEL || process.env.ENVIRONMENT === "production") {
  // Vercel serverless environment - use /tmp
  UPLOADS_DIR = "/tmp/uploads";
} else if (process.env.NODE_ENV && process.env.NODE_ENV === "production") {
  // Other production environments
  UPLOADS_DIR = "dist/uploads";
}

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    logger.warn(`Could not create uploads directory: ${UPLOADS_DIR}`, error);
    // Fallback to /tmp if creation fails
    UPLOADS_DIR = "/tmp";
  }
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()} - ${file.originalname}`);
  }
});

const upload = multer({ storage });
export default upload;
