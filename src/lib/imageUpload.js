// Shared client-side image-upload constraints for listing photos.
// Real File objects are uploaded via multipart/form-data — no canvas, no base64.
// These mirror the server limits (multer 5 MB / image-only) so bad files are
// caught before the request is sent.

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per image

export const isImageFile = (f) =>
  !!f && typeof f.type === 'string' && /^image\//i.test(f.type) && f.size > 0;

export const isAcceptableImageFile = (f) => isImageFile(f) && f.size <= MAX_IMAGE_BYTES;
