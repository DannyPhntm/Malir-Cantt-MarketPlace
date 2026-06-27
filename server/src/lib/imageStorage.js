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

const CLOUDINARY_ENABLED = !!process.env.CLOUDINARY_URL;
if (CLOUDINARY_ENABLED) {
  // The SDK auto-configures from CLOUDINARY_URL; this just validates it parsed.
  cloudinary.config({ secure: true });
}

export const imageStorageMode = CLOUDINARY_ENABLED ? 'cloudinary' : 'inline-base64';

const isHttpUrl = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
const isDataUrl = (s) => typeof s === 'string' && /^data:image\//i.test(s);

/**
 * Persist one image reference and return the URL to store.
 * - Already an http(s) URL → returned unchanged (e.g. Unsplash seed data, re-saved listings).
 * - data: URL + Cloudinary configured → uploaded, returns the secure CDN URL.
 * - data: URL + no Cloudinary → returned unchanged (base64 dev fallback).
 */
export async function storeImage(input, { folder = 'listings' } = {}) {
  if (isHttpUrl(input)) return input;
  if (CLOUDINARY_ENABLED && isDataUrl(input)) {
    const res = await cloudinary.uploader.upload(input, {
      folder: `malir/${folder}`,
      resource_type: 'image',
    });
    return res.secure_url;
  }
  return input; // base64 dev fallback (or any other string)
}

/**
 * Persist an array of { imageUrl, displayOrder } image inputs, preserving order.
 * Uploads run in parallel; order is taken from displayOrder (fallback to index).
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
