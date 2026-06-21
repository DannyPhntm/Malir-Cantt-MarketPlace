import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/* POST /api/contact — public contact form submission.
   Persisted to the database (and logged in dev). No email integration yet. */
export const createContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message, category } = req.body;

  const saved = await prisma.contactMessage.create({
    data: { name, email, subject, message, category: category || 'general' },
  });

  console.info(`[contact] new ${saved.category} message from ${saved.email} — "${saved.subject}"`);

  res.status(201).json({ received: true, id: saved.id });
});
