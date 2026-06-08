import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

/** True when real Cloudinary credentials are set (not placeholders). */
export function isCloudinaryConfigured() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) return false;
  if (name.includes('your_') || key.includes('your_') || secret.includes('your_')) {
    return false;
  }
  return true;
}

export function assertCloudinaryForRuntime() {
  if (process.env.NODE_ENV === 'test') return;

  if (!isCloudinaryConfigured()) {
    const msg =
      'Cloudinary required: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in server/.env';
    if (process.env.NODE_ENV === 'production') {
      console.error(msg);
      process.exit(1);
    }
    console.warn(` ${msg} — admin image uploads disabled until configured.`);
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

assertCloudinaryForRuntime();

export default cloudinary;
