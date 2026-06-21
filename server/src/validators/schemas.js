import { z } from 'zod';
import {
  ACCOUNT_TYPES,
  CATEGORIES,
  LISTING_STATUSES,
  IMAGE_OPTIONAL_CATEGORIES,
  MIN_IMAGES,
  MAX_IMAGES,
  BUSINESS_TYPES,
  POSTING_TYPES,
  SELLER_STATUSES,
  PAYMENT_STATUSES,
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

const listingImageInput = z.object({
  imageUrl: z.string().trim().url('Each image must be a valid URL.'),
  displayOrder: z.number().int().min(0).optional(),
});

export const listingCreateSchema = z
  .object({
    // Owner is taken from the auth token; body userId (if sent) is ignored.
    userId: z.number().int().positive().optional(),
    title: z.string().trim().min(3, 'Title is required.'),
    description: z.string().trim().min(10, 'Description must be at least 10 characters.'),
    category: z.enum(CATEGORIES),
    subcategory: z.string().trim().optional().nullable(),
    postingType: z.enum(POSTING_TYPES).optional().default('personal'),
    price: z.number().int().nonnegative('Price must be a positive number.'),
    featuredRequested: z.boolean().optional().default(false),
    // Category-specific attributes — a flat map of string values.
    details: z.record(z.string()).optional().default({}),
    images: z.array(listingImageInput).max(MAX_IMAGES, `A listing can have at most ${MAX_IMAGES} images.`).default([]),
  })
  // Image-count rule: >= 1 for every category except jobs/services/other.
  .superRefine((data, ctx) => {
    const optional = IMAGE_OPTIONAL_CATEGORIES.includes(data.category);
    if (!optional && data.images.length < MIN_IMAGES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['images'],
        message: `At least ${MIN_IMAGES} image is required for ${data.category} listings.`,
      });
    }
    if (!isValidSubcategory(data.category, data.subcategory)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subcategory'],
        message: 'Subcategory does not belong to the selected category.',
      });
    }
  });

export const listingUpdateSchema = z
  .object({
    title: z.string().trim().min(3).optional(),
    description: z.string().trim().min(10).optional(),
    price: z.number().int().nonnegative().optional(),
    featuredRequested: z.boolean().optional(),
    // Subcategory editable on edit; category itself is not.
    subcategory: z.string().trim().optional().nullable(),
    // Category-specific attributes (Edit Listing). Category itself is not editable.
    details: z.record(z.string()).optional(),
    // Full image set on edit (add/remove/reorder). Min-count rule is enforced in
    // the controller (it depends on the category). Base64 data-URLs allowed.
    images: z.array(listingImageInput).max(MAX_IMAGES, `A listing can have at most ${MAX_IMAGES} images.`).optional(),
    // Owner lifecycle (mark sold / hide / re-activate) + resubmit a rejected
    // listing (→ pending). Transition rules enforced in the controller; admins
    // may set any status via /status.
    status: z.enum(['pending', 'approved', 'sold', 'hidden']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update.' });

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
