import { z } from 'zod';
import {
  ACCOUNT_TYPES,
  CATEGORIES,
  LISTING_STATUSES,
  MAX_IMAGES,
  BUSINESS_TYPES,
  POSTING_TYPES,
  SELLER_STATUSES,
  PAYMENT_STATUSES,
  SHOP_CATEGORIES,
  SHOP_STATUSES,
  MAX_SHOP_IMAGES,
  isValidSubcategory,
} from '../lib/constants.js';

/* ── Reusable primitives ─────────────────────────────────────────────────────── */

const email = z.string().trim().toLowerCase().email('A valid email is required.');
const password = z.string().min(8, 'Password must be at least 8 characters.');
const code = z.string().trim().regex(/^\d{6}$/, 'Code must be 6 digits.');
// Pakistani local format e.g. 03XX-XXXXXXX (dashes optional).
const phone = z.string().trim().regex(/^0\d{3}-?\d{7}$/, 'Enter a valid phone number (03XX-XXXXXXX).');

/* ── Auth / users ────────────────────────────────────────────────────────────── */

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.'),
  email,
  password,
  phone,
  accountType: z.enum(ACCOUNT_TYPES).default('personal'),
  residentLocation: z.string().trim().min(2, 'Resident location is required.'),
  canttPassNumber: z.string().trim().optional().nullable(),
  // Only used when accountType === 'business'
  businessName: z.string().trim().min(2).optional(),
  businessType: z.enum(BUSINESS_TYPES).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required.'),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    phone: phone.optional(),
    residentLocation: z.string().trim().min(2).optional(),
    canttPassNumber: z.string().trim().nullable().optional(),
    // Profile photo: a base64 data-URL (or external URL), or null to remove it.
    // Capped to keep payloads sane — the client compresses before sending.
    avatarUrl: z.string().trim().max(1_500_000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update.' });

// Change password while authenticated — requires the current password.
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: password,
});

// Admin user list — optional name/email search. (role/accountType are NOT
// editable via any schema, so accounts cannot self-promote to admin.)
export const userListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
});

/* ── Contact form ────────────────────────────────────────────────────────────── */

const CONTACT_CATEGORIES = ['general', 'business', 'featured', 'bug', 'scam', 'suggestion'];

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.').max(100),
  email,
  subject: z.string().trim().min(3, 'Subject is required.').max(150),
  message: z.string().trim().min(10, 'Message must be at least 10 characters.').max(2000),
  category: z.enum(CONTACT_CATEGORIES).optional().default('general'),
});

export const verifyEmailSchema = z.object({ email, code });

export const resendVerificationSchema = z.object({ email });

export const requestResetSchema = z.object({ email });

export const resetPasswordSchema = z.object({ email, code, password });

// Email changes go through a dedicated verify-the-new-address flow (never via
// updateUserSchema, which intentionally omits email).
export const requestEmailChangeSchema = z.object({ newEmail: email });

export const confirmEmailChangeSchema = z.object({ newEmail: email, code });

/* ── Listings ────────────────────────────────────────────────────────────────── */

// ── Multipart (file-upload) listing schemas ──────────────────────────────────
// Add/Edit now submit real files via multipart/form-data, so the text fields
// arrive as strings and images are NOT in the body (they're req.files). These
// schemas validate just the text fields, coercing the stringified values.
const jsonObject = (fallback) =>
  z.preprocess((v) => {
    if (v == null || v === '') return fallback;
    if (typeof v === 'object') return v;
    try { return JSON.parse(v); } catch { return v; } // invalid JSON → let schema reject
  }, z.record(z.string().max(500, 'Detail value is too long.')));

// 'true'/'false' string (or real boolean) → boolean.
const formBool = z.preprocess((v) => v === true || v === 'true', z.boolean());

export const listingCreateFieldsSchema = z
  .object({
    title: z.string().trim().min(3, 'Title is required.').max(120, 'Title is too long (max 120 characters).'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters.').max(5000, 'Description is too long (max 5000 characters).'),
    category: z.enum(CATEGORIES),
    subcategory: z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(60).nullable().optional()),
    postingType: z.enum(POSTING_TYPES).optional().default('personal'),
    price: z.coerce.number().int().nonnegative('Price must be a positive number.'),
    featuredRequested: formBool.optional().default(false),
    details: jsonObject({}).optional().default({}),
  })
  .superRefine((data, ctx) => {
    if (!isValidSubcategory(data.category, data.subcategory)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['subcategory'], message: 'Subcategory does not belong to the selected category.' });
    }
  });

// Edit: every text field optional; image set is described by `imagesOrder`
// (kept existing URLs + placeholders for newly-uploaded files), validated in the controller.
const imagesOrderItem = z.union([
  z.object({ kind: z.literal('kept'), url: z.string().trim() }),
  z.object({ kind: z.literal('new'), idx: z.number().int().nonnegative() }),
]);

export const listingUpdateFieldsSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  price: z.coerce.number().int().nonnegative().optional(),
  featuredRequested: formBool.optional(),
  subcategory: z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(60).nullable().optional()),
  details: jsonObject(undefined).optional(),
  status: z.enum(['pending', 'approved', 'sold', 'hidden']).optional(),
  imagesOrder: z
    .preprocess((v) => {
      if (v == null || v === '') return undefined;
      if (Array.isArray(v)) return v;
      try { return JSON.parse(v); } catch { return v; }
    }, z.array(imagesOrderItem).max(MAX_IMAGES, `A listing can have at most ${MAX_IMAGES} images.`))
    .optional(),
});

// Admin moderation + featured control. Any subset is allowed so a single
// endpoint can change status and/or toggle the featured request/activation.
export const listingStatusSchema = z
  .object({
    status: z.enum(LISTING_STATUSES).optional(),
    featuredActive: z.boolean().optional(),
    featuredRequested: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update.' });

// Query booleans arrive as the strings 'true'/'false'. z.coerce.boolean() is
// wrong here (it makes 'false' → true), so parse the two literals explicitly.
const queryBool = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true')
  .optional();

export const listingQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  subcategory: z.string().trim().optional(),
  postingType: z.enum(POSTING_TYPES).optional(),
  status: z.enum(LISTING_STATUSES).optional(),
  userId: z.coerce.number().int().positive().optional(),
  featured: queryBool,
  featuredRequested: queryBool,
});

/* ── Business accounts ───────────────────────────────────────────────────────── */

export const businessApplySchema = z.object({
  // Owner is taken from the auth token.
  userId: z.number().int().positive().optional(),
  businessName: z.string().trim().min(2, 'Business name is required.'),
  businessType: z.string().trim().max(60).optional().nullable(),
});

/* ── Saved listings ──────────────────────────────────────────────────────────── */

export const savedAddSchema = z.object({
  listingId: z.number().int().positive('A valid listingId is required.'),
});

/* ── Business accounts (decision) ────────────────────────────────────────────── */

export const businessDecisionSchema = z
  .object({
    sellerStatus: z.enum(SELLER_STATUSES).optional(),
    paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  })
  .refine((d) => d.sellerStatus || d.paymentStatus, {
    message: 'Provide sellerStatus and/or paymentStatus.',
  });

// Business account applies for Business Seller status — no body (account from token).
export const sellerApplySchema = z.object({});

/* ── Shops directory ─────────────────────────────────────────────────────────── */
const shopImage = z.string().trim().max(1_500_000); // external URL or base64 data-URL

export const shopCreateSchema = z.object({
  name: z.string().trim().min(2, 'Shop name is required.').max(120),
  shopCategory: z.enum(SHOP_CATEGORIES),
  sells: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().min(2, 'Location is required.').max(160),
  phone,
  whatsapp: phone.optional().nullable(),
  openingHours: z.string().trim().max(120).optional().nullable(),
  deliveryAvailable: z.boolean().optional().default(false),
  logoUrl: z.string().trim().max(1_500_000).optional().nullable(),
  images: z.array(shopImage).max(MAX_SHOP_IMAGES, `A shop can have at most ${MAX_SHOP_IMAGES} images.`).optional().default([]),
});

export const shopUpdateSchema = shopCreateSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update.' });

export const shopStatusSchema = z.object({ status: z.enum(SHOP_STATUSES) });

export const shopQuerySchema = z.object({
  shopCategory: z.enum(SHOP_CATEGORIES).optional(),
  status: z.enum(SHOP_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
});
