import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendContactNotification } from '../lib/emailer.js';

/* POST /api/contact — public contact form submission.
   Persisted to the database, then a notification is emailed to the support inbox
   (CONTACT_TO_EMAIL). The email is best-effort: a delivery failure is logged
   server-side but does NOT fail the request — the message is already saved, so
   the user still gets a success response. */
export const createContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message, category } = req.body;

  const saved = await prisma.contactMessage.create({
    data: { name, email, subject, message, category: category || 'general' },
  });

  console.info(`[contact] new ${saved.category} message from ${saved.email} — "${saved.subject}"`);

  // Best-effort support notification (never blocks the submission).
  try {
    await sendContactNotification({
      name: saved.name,
      email: saved.email,
      subject: saved.subject,
      message: saved.message,
      category: saved.category,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    // Safe log only — no provider internals / secrets reach the client.
    console.error(`[contact] notification email failed for message #${saved.id}:`, err?.message || 'unknown error');
  }

  res.status(201).json({ received: true, id: saved.id });
});
