// Image storage strategy.
//
// Production-safe: when CLOUDINARY_URL is configured, base64/data-URL images
// submitted by the client are uploaded to Cloudinary and we persist the returned
// stable https URL (small DB rows, small API responses, real CDN delivery).
//
// Dev fallback: when Cloudinary is NOT configured, the data URL is stored as-is
// (base64 in Postgres) so local development keeps working with no external
// service. This is fine for dev but is NOT recommended for production — set
// CLOUDINARY_URL in production to avoid bloated rows/responses.
//
// No secrets are hardcoded — the Cloudinary SDK reads CLOUDINARY_URL from env
// (format: cloudinary://<api_key>:<api_secret>@<cloud_name>).
import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from '../middleware/errorHandler.js';
import { MIN_IMAGE_BYTES, MIN_IMAGE_DATA_URL_LEN } from './constants.js';

const CLOUDINARY_ENABLED = !!process.env.CLOUDINARY_URL;
if (CLOUDINARY_ENABLED) {
  // The SDK auto-configures from CLOUDINARY_URL; this just validates it parsed.
  cloudinary.config({ secure: true });
}

export const imageStorageMode = CLOUDINARY_ENABLED ? 'cloudinary' : 'inline-base64';

const isHttpUrl = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
const isDataUrl = (s) => typeof s === 'string' && /^data:image\//i.test(s);

const UPLOAD_FAILED = 'Images could not be uploaded. Please try again.';

// Decoded byte size of a base64 data URL (without actually decoding it).
function dataUrlByteLength(dataUrl) {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return 0;
  const b64 = dataUrl.slice(comma + 1);
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

// Reject empty / placeholder / non-image inputs BEFORE spending a Cloudinary
// upload on them. A blank canvas export (the old iOS bug) is a few hundred bytes;
// real photos are tens of KB+.
function assertPlausibleImageInput(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new ApiError(422, UPLOAD_FAILED);
  }
  if (isHttpUrl(input)) return; // already-stored CDN / seed link
  if (isDataUrl(input)) {
    if (input.length < MIN_IMAGE_DATA_URL_LEN || dataUrlByteLength(input) < MIN_IMAGE_BYTES) {
      throw new ApiError(422, UPLOAD_FAILED);
    }
    return;
  }
  throw new ApiError(422, UPLOAD_FAILED);
}

/**
 * Persist one image reference and return the URL to store.
 * - Already an http(s) URL → returned unchanged (e.g. Unsplash seed data, re-saved listings).
 * - data: URL + Cloudinary configured → uploaded, returns the secure CDN URL.
 * - data: URL + no Cloudinary → returned unchanged (base64 dev fallback).
 * Throws ApiError(422) for empty/blank/tiny inputs or a Cloudinary result that
 * comes back blank (zero dimensions / a few hundred bytes).
 */
export async function storeImage(input, { folder = 'listings' } = {}) {
  assertPlausibleImageInput(input);
  if (isHttpUrl(input)) return input;
  if (CLOUDINARY_ENABLED && isDataUrl(input)) {
    const res = await cloudinary.uploader.upload(input, {
      folder: `malir/${folder}`,
      resource_type: 'image',
    });
    // A successful API call can still yield a blank/degenerate asset — verify the
    // result actually looks like a real image before we persist its URL.
    await assertCloudinaryResultOk(res);
    return res.secure_url;
  }
  return input; // base64 dev fallback (or any other validated string)
}

// Verify a Cloudinary upload result actually looks like a real image, not a
// blank/degenerate asset. Cleans up the bad asset, then throws.
async function assertCloudinaryResultOk(res) {
  if (!res?.secure_url || !(res.width > 0) || !(res.height > 0) || !(res.bytes >= MIN_IMAGE_BYTES)) {
    if (res?.public_id) {
      try { await cloudinary.uploader.destroy(res.public_id); } catch { /* ignore */ }
    }
    throw new ApiError(422, UPLOAD_FAILED);
  }
}

/**
 * Persist a single uploaded file (Multer memory buffer) and return its URL.
 * - Cloudinary configured → streams the buffer up, verifies the result, returns secure_url.
 * - No Cloudinary (dev) → returns a base64 data URL for inline storage.
 * This is the production upload path for listing images (no client canvas/base64).
 */
export async function storeImageBuffer(file, { folder = 'listings' } = {}) {
  if (!file?.buffer?.length) throw new ApiError(422, UPLOAD_FAILED);

  if (!CLOUDINARY_ENABLED) {
    const mime = file.mimetype || 'image/jpeg';
    return `data:${mime};base64,${file.buffer.toString('base64')}`;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `malir/${folder}`, resource_type: 'image' },
      async (err, res) => {
        if (err) return reject(new ApiError(422, UPLOAD_FAILED));
        try {
          await assertCloudinaryResultOk(res);
          // Dev-only, no secrets: confirm the asset is real.
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[imageStorage] cloudinary ok', { bytes: res.bytes, width: res.width, height: res.height });
          }
          resolve(res.secure_url);
        } catch (e) {
          reject(e);
        }
      },
    );
    stream.end(file.buffer);
  });
}

/** Upload an ordered array of Multer files; returns [{ imageUrl, displayOrder }]. */
export async function storeImageBuffers(files = [], opts = {}) {
  return Promise.all(
    files.map(async (file, i) => ({
      imageUrl: await storeImageBuffer(file, opts),
      displayOrder: i,
    })),
  );
}

/**
 * Persist an array of { imageUrl, displayOrder } image inputs, preserving order.
 * Uploads run in parallel; order is taken from displayOrder (fallback to index).
 * If any image is invalid/blank the whole call rejects — the caller must not
 * create a listing with a partial/broken image set.
 */
export async function storeImages(images = [], opts = {}) {
  const stored = await Promise.all(
    images.map(async (img, i) => ({
      imageUrl: await storeImage(img.imageUrl, opts),
      displayOrder: img.displayOrder ?? i,
    })),
  );
  return stored;
}

// Exported for tests.
export const __test__ = { assertPlausibleImageInput, dataUrlByteLength };
