import path from "path";
import { v4 as uuidv4 } from "uuid";
import sdb from "./database.js";

const BUCKET = process.env.SUPABASE_BANNERS_BUCKET || "banners";

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

const saveBannerImage = async ({ fileName, fileData }) => {
  const extension = path.extname(fileName || ".jpg").toLowerCase() || ".jpg";
  const safeName = `banner-${uuidv4()}${extension}`;
  const buffer = Buffer.from(fileData, "base64");
  const contentType = MIME_BY_EXT[extension] || "image/jpeg";

  const { error } = await sdb.storage
    .from(BUCKET)
    .upload(safeName, buffer, { contentType, upsert: false });

  if (error) {
    throw new Error(`Banner upload failed: ${error.message}`);
  }

  const { data } = sdb.storage.from(BUCKET).getPublicUrl(safeName);
  return data.publicUrl;
};

export { saveBannerImage };
