// Multipart image upload (listings). Files are held in memory as Buffers so we
// can stream them straight to Cloudinary — nothing touches disk. Real File data
// is uploaded; the client no longer canvas-encodes/base64s images.
import multer from 'multer';
import { ApiError } from './errorHandler.js';
import { MAX_IMAGES } from '../lib/constants.js';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per image

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: MAX_IMAGES,
  },
  fileFilter: (_req, file, cb) => {
    if (/^image\//i.test(file.mimetype)) return cb(null, true);
    cb(new ApiError(422, 'Only image files are allowed.'));
  },
});

// `images` is the multipart field name used by both Add and Edit. Wrapped so
// Multer's own errors become clean ApiErrors instead of a 500.
export function uploadListingImages(req, res, next) {
  upload.array('images', MAX_IMAGES)(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(422, 'Each image must be 5 MB or smaller.'));
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new ApiError(422, `You can upload at most ${MAX_IMAGES} images.`));
      }
      return next(new ApiError(422, 'Images could not be uploaded. Please try again.'));
    }
    next(err);
  });
}
