// Email transport for People of Malir Cantt Bazaar.
//
// Uses the Resend HTTP API, configured entirely from environment variables.
// When RESEND_API_KEY is not configured (local dev / CI), it falls back to a
// SERVER-SIDE console log so flows keep working without real credentials —
// codes are never sent to the client.

import { Resend } from 'resend';
import { ApiError } from '../middleware/errorHandler.js';

const { RESEND_API_KEY } = process.env;

const MAIL_FROM = process.env.MAIL_FROM || 'People of Malir Cantt Bazaar <onboarding@resend.dev>';

// Client is created lazily and reused. Null when no API key is configured.
let client = null;
const isConfigured = Boolean(RESEND_API_KEY);

function getClient() {
  if (!isConfigured) return null;
  if (!client) client = new Resend(RESEND_API_KEY);
  return client;
}

/**
 * Send an email.
 *
 * - RESEND_API_KEY configured  → send a real email via Resend; the code travels
 *   ONLY inside the email (never logged, never returned to the client).
 * - RESEND_API_KEY unconfigured → do NOT crash; log a clear development message
 *   that includes the code so it can be used to complete the flow locally. This
 *   log is server-side only.
 *
 * `code` / `label` are optional and used only to make the dev log readable.
 * Throws ApiError(502) on delivery failure so callers surface a friendly error.
 */
export async function sendEmail({ to, subject, html, text, code, label }) {
  const resend = getClient();
  if (!resend) {
    // ── Development fallback: RESEND_API_KEY not configured ───────────────────
    // The code is intentionally printed here (server console only) so local dev
    // and CI can complete verification without a mail provider. It is never sent
    // to the client and never logged once Resend is configured.
    console.info(
      '\n──────────────────────────────────────────────────────────────\n' +
        '  [emailer] DEV MODE — RESEND_API_KEY not set, email NOT sent.\n' +
        `  To:    ${to}\n` +
        `  Type:  ${label || subject}\n` +
        (code ? `  CODE:  ${code}   ← use this to continue\n` : '') +
        '  Set RESEND_API_KEY + MAIL_FROM in server/.env to send real email.\n' +
        '──────────────────────────────────────────────────────────────\n',
    );
    return { delivered: false, reason: 'resend-not-configured' };
  }
  // Resend configured → real send. The code lives only in the email body.
  try {
    const { data, error } = await resend.emails.send({ from: MAIL_FROM, to, subject, html, text });
    // Resend returns errors in the `error` field rather than throwing.
    if (error) throw new Error(error.message || 'Resend reported a delivery error.');
    return { delivered: true, id: data?.id };
  } catch (err) {
    console.error('[emailer] Resend delivery failed:', err?.message || err);
    throw new ApiError(502, 'We could not send the email. Please try again in a moment.');
  }
}

/* ── Templates ───────────────────────────────────────────────────────────────── */

const BRAND = 'People of Malir Cantt Bazaar';

function codeLayout({ heading, intro, code, footer }) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
    <h1 style="font-family:Manrope,Arial,sans-serif;font-size:20px;color:#0d2a1a;margin:0 0 8px">${BRAND}</h1>
    <h2 style="font-size:18px;margin:24px 0 8px">${heading}</h2>
    <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 24px">${intro}</p>
    <div style="font-family:Manrope,Arial,sans-serif;font-size:32px;font-weight:800;letter-spacing:8px;
                color:#1a6b45;background:#f0f6f2;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px">
      ${code}
    </div>
    <p style="font-size:13px;line-height:1.6;color:#888;margin:0">${footer}</p>
  </div>`;
}

export function sendVerificationEmail({ to, code, name }) {
  return sendEmail({
    to,
    code,
    label: 'Email verification',
    subject: `Your ${BRAND} verification code`,
    text: `Hi${name ? ' ' + name : ''}, your verification code is ${code}. It expires in 10 minutes.`,
    html: codeLayout({
      heading: 'Verify your email',
      intro: `Hi${name ? ' ' + name : ''}, welcome to ${BRAND}. Enter the code below to verify your email address.`,
      code,
      footer: "This code expires in 10 minutes. If you didn't request it, you can ignore this email.",
    }),
  });
}

export function sendPasswordResetEmail({ to, code }) {
  return sendEmail({
    to,
    code,
    label: 'Password reset',
    subject: `Reset your ${BRAND} password`,
    text: `Your password reset code is ${code}. It expires in 10 minutes.`,
    html: codeLayout({
      heading: 'Reset your password',
      intro: 'Use the code below to reset your password.',
      code,
      footer: "This code expires in 10 minutes. If you didn't request a reset, you can safely ignore this email.",
    }),
  });
}

export function sendEmailChangeEmail({ to, code }) {
  return sendEmail({
    to,
    code,
    label: 'Email change confirmation',
    subject: `Confirm your new ${BRAND} email`,
    text: `Your email change confirmation code is ${code}. It expires in 10 minutes.`,
    html: codeLayout({
      heading: 'Confirm your new email address',
      intro: `You asked to change your ${BRAND} email to this address. Enter the code below to confirm the change.`,
      code,
      footer: "This code expires in 10 minutes. If you didn't request this change, you can ignore this email.",
    }),
  });
}
