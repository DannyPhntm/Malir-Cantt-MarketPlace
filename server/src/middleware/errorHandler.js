// A small typed error so controllers can throw clean HTTP errors.
export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    // Optional machine-readable payload merged into the JSON response (e.g.
    // `{ unverified: true }`) so the client can branch without parsing prose.
    this.details = details;
  }
}

// Wraps an async controller so thrown/rejected errors reach the error handler.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// 404 for unmatched routes.
export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Centralised error handler. Translates known Prisma + ApiError cases to clean
// JSON; anything else becomes a 500 (details logged server-side only).
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, ...(err.details || {}) });
  }
  // Prisma known request errors.
  if (err.code === 'P2002') {
    const target = err.meta?.target?.join?.(', ') || 'field';
    return res.status(409).json({ error: `A record with that ${target} already exists.` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Related record does not exist (foreign key failed).' });
  }

  console.error('[unhandled error]', err);
  res.status(500).json({ error: 'Internal server error' });
}
