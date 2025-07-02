import multer from "multer";
import fs from "fs";

let UPLOADS_DIR = "uploads";
if (process.env.NODE_ENV && process.env.NODE_ENV === "production") {
  UPLOADS_DIR = "dist/uploads";
}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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
