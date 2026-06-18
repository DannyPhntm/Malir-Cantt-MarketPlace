// Email transport for People of Malir Cantt Bazaar.
//
// Uses Nodemailer over SMTP, configured entirely from environment variables so
// the same code works with any provider (Gmail, Mailtrap, SES, …). When SMTP is
// not configured (local dev / CI), it falls back to a SERVER-SIDE console log so
// flows keep working without real credentials — codes are never sent to the
// client.

import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

const MAIL_FROM = process.env.MAIL_FROM || 'People of Malir Cantt Bazaar <no-reply@malircantt.pk>';

// Transport is created lazily and reused. Null when SMTP isn't configured.
let transport = null;
const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

function getTransport() {
  if (!isConfigured) return null;
  if (!transport) {
    transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      // `secure: true` for port 465; STARTTLS otherwise.
      secure: SMTP_SECURE ? SMTP_SECURE === 'true' : Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transport;
}

/**
 * Send an email.
 *
 * - SMTP configured  → send a real email; the code travels ONLY inside the email
 *   (never logged, never returned to the client).
 * - SMTP unconfigured → do NOT crash; log a clear development message that
 *   includes the code so it can be used to complete the flow locally. This log
 *   is server-side only.
 *
 * `code` / `label` are optional and used only to make the dev log readable.
 */
export async function sendEmail({ to, subject, html, text, code, label }) {
  const t = getTransport();
  if (!t) {
    // ── Development fallback: SMTP not configured ────────────────────────────
    // The code is intentionally printed here (server console only) so local dev
    // and CI can complete verification without a mail provider. It is never sent
    // to the client and never logged once SMTP is configured.
    console.info(
      '\n──────────────────────────────────────────────────────────────\n' +
        '  [emailer] DEV MODE — SMTP not configured, email NOT sent.\n' +
        `  To:    ${to}\n` +
        `  Type:  ${label || subject}\n` +
        (code ? `  CODE:  ${code}   ← use this to continue\n` : '') +
        '  Configure SMTP_* in server/.env to send real email.\n' +
        '──────────────────────────────────────────────────────────────\n',
    );
    return { delivered: false, reason: 'smtp-not-configured' };
  }
  // SMTP configured → real send. The code lives only in the email body.
  await t.sendMail({ from: MAIL_FROM, to, subject, html, text });
  return { delivered: true };
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
