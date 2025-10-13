/* eslint-disable */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { v4 as uuid } from "uuid";
import mime from "mime-types";

dotenv.config();

const REGION = "auto";
const ENDPOINT = process.env.R2_ENDPOINT;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET;

const PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL;

if (!ENDPOINT || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET) {
  throw new Error("R2 configuration is incomplete (endpoint, keys, or bucket missing).");
}

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY
  }
});

export async function uploadFileR2(filePath: string, key: string, requireDownloadableUrl: boolean = false) {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        message: `File not found: ${filePath}`,
        code: 404
      };
    }

    const fileStream = fs.createReadStream(filePath);
    const contentType = mime.lookup(filePath) || "application/octet-stream";

    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: contentType,
      ContentDisposition: requireDownloadableUrl ? "attachment" : "inline"
    };

    const result = await s3.send(new PutObjectCommand(params));

    const publicUrl = `${PUBLIC_BASE_URL}/${key}`;

    return {
      success: true,
      publicUrl,
      key,
      etag: result.ETag,
      bucket: BUCKET
    };
  } catch (error) {
    console.error("Upload failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error from Cloudflare R2",
      code: 500
    };
  }
}

export function generateFileKeyForR2(originalFileName: string, folder: string = "uploads"): string {
  const ext = path.extname(originalFileName);
  const nameWithoutExt = path.basename(originalFileName, ext);
  const uniqueId = uuid();
  const timestamp = Date.now();

  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "-");
  return `${folder}/${timestamp}-${uniqueId}-${cleanName}${ext}`;
}

export async function uploadFileR2WithAutoKey(
  filePath: string,
  folder: string = "uploads",
  requireDownloadableUrl: boolean = false
) {
  const originalFileName = path.basename(filePath);
  const key = generateFileKeyForR2(originalFileName, folder);

  return await uploadFileR2(filePath, key, requireDownloadableUrl);
}
