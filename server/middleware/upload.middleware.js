import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { ApiError } from '../utils/helpers.js';
import logger from '../config/logger.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
// Model allows 10 gallery images + 1 cover. Keep a small buffer for variants but
// don't let multer accept 3x more files than Mongoose will ever store.
const MAX_FILES = 12;

const memoryStorage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
  cb(new ApiError(400, `Unsupported image type: ${file.mimetype}. Use JPG, PNG, WEBP or AVIF.`));
};

export const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_BYTES, files: MAX_FILES },
  fileFilter,
});

export const uploadAny = () => (req, res, next) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      if (err instanceof ApiError) return next(err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new ApiError(413, `Image too large. Max ${MAX_BYTES / 1024 / 1024}MB per file.`),
        );
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(413, `Too many files. Max ${MAX_FILES} per request.`));
      }
      return next(new ApiError(400, err.message || 'Upload failed.'));
    }

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        try {
          const detected = await fileTypeFromBuffer(file.buffer);
          if (!detected || !ALLOWED_MIME.has(detected.mime)) {
            return next(
              new ApiError(
                400,
                `Invalid or malicious file content detected for "${file.originalname}". Only JPG, PNG, WEBP, and AVIF are allowed.`,
              ),
            );
          }
        } catch {
          return next(
            new ApiError(400, `Failed to analyze file signature for "${file.originalname}".`),
          );
        }
      }
    }

    next();
  });
};

export const requireCloudinary = (_req, _res, next) => {
  if (!isCloudinaryConfigured()) {
    return next(
      new ApiError(
        503,
        'Image uploads need Cloudinary. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to server/.env',
      ),
    );
  }
  next();
};

export const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return;
  if (!isCloudinaryConfigured()) return;
  if (!imageUrl.includes('res.cloudinary.com')) return;

  try {
    const parts = imageUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return;
    const afterUpload = parts.slice(uploadIndex + 1);
    const versionPrefix = afterUpload[0]?.startsWith('v') ? 1 : 0;
    const publicIdWithExt = afterUpload.slice(versionPrefix).join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error('Cloudinary delete failed', { error: error.message });
  }
};
