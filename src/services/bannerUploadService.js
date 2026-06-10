import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const BANNER_DIR = path.join(path.resolve(), "src/public/banners");

const ensureBannerDir = () => {
  if (!fs.existsSync(BANNER_DIR)) {
    fs.mkdirSync(BANNER_DIR, { recursive: true });
  }
};

const saveBannerImage = ({ fileName, fileData }) => {
  ensureBannerDir();

  const extension = path.extname(fileName || ".jpg") || ".jpg";
  const safeName = `banner-${uuidv4()}${extension}`;
  const filePath = path.join(BANNER_DIR, safeName);
  const buffer = Buffer.from(fileData, "base64");

  fs.writeFileSync(filePath, buffer);
  return `/static/banners/${safeName}`;
};

export { saveBannerImage };
