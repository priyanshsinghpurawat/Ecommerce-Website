import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './env.js';
import logger from './logger.js';

export function isCloudinaryConfigured() {
  const name = ENV.CLOUDINARY_CLOUD_NAME;
  const key = ENV.CLOUDINARY_API_KEY;
  const secret = ENV.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) return false;
  if (name.includes('your_') || key.includes('your_') || secret.includes('your_')) {
    return false;
  }
  return true;
}

export function assertCloudinaryForRuntime() {
  if (ENV.NODE_ENV === 'test') return;

  if (!isCloudinaryConfigured()) {
    const msg =
      'Cloudinary required: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in server/.env';
    if (ENV.NODE_ENV === 'production') {
      logger.error(msg);
      process.exit(1);
    }
    logger.warn(`${msg} — admin image uploads disabled until configured.`);
    return;
  }

  cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET,
  });
}

assertCloudinaryForRuntime();

export default cloudinary;
