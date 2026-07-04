/**
 * Buffer → Cloudinary stream uploader.
 *
 * Why: `multer-storage-cloudinary` pipes the file directly during the multer
 * parse step, which means upload errors (auth, network, quota) bubble up
 * BEFORE our error middleware can format them — the client sees 500 with no
 * useful body. With `memoryStorage` + this helper we own the upload step
 * inside the controller, so we can return clean ApiError JSON.
 */
import { Readable } from 'stream';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { ApiError } from './helpers.js';

const DEFAULT_FOLDER = 'mensvibe/products';

/**
 * Upload a single file buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {object} opts
 * @param {string} [opts.folder]
 * @param {string} [opts.filename]
 * @returns {Promise<string>} secure_url
 */
export const uploadBufferToCloudinary = (buffer, opts = {}) =>
  new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(
        new ApiError(
          503,
          'Image uploads need Cloudinary. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to server/.env',
        ),
      );
    }
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return reject(new ApiError(400, 'Empty image upload.'));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: opts.folder || DEFAULT_FOLDER,
        resource_type: 'image',
        public_id: opts.filename ? opts.filename.replace(/\.[^.]+$/, '') : undefined,
        transformation: [{ width: 1600, height: 2000, crop: 'limit', quality: 'auto:good' }],
      },
      (err, result) => {
        if (err) return reject(new ApiError(502, `Image upload failed: ${err.message}`));
        if (!result?.secure_url) return reject(new ApiError(502, 'Cloudinary returned no URL.'));
        resolve(result.secure_url);
      },
    );

    Readable.from(buffer).pipe(stream);
  });

/**
 * Upload an array of multer-memory files in parallel. Returns secure URLs.
 * Throws ApiError on first failure (caller is responsible for compensating
 * any URLs already produced — currently we let Cloudinary lifecycle keep the
 * orphan, since cost is negligible; revisit if quota becomes a concern).
 */
export const uploadFilesToCloudinary = async (files = [], opts = {}) => {
  if (!files.length) return [];
  return Promise.all(
    files.map((f) => uploadBufferToCloudinary(f.buffer, { ...opts, filename: f.originalname })),
  );
};
