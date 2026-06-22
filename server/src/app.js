import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes/index.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Allowed browser origins for CORS. Configure via CLIENT_ORIGIN (comma-separated
// for multiple). Defaults to the local Vite dev server.
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Express app, exported separately from the listener so it can be imported by
// tests or a serverless adapter without binding a port.
export function createApp() {
  const app = express();

  // Security headers (defaults). API serves JSON only, so allow cross-origin
  // resource sharing of those responses to the configured frontend.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS: allow only the configured origin(s). Requests with no Origin header
  // (curl, server-to-server, health checks) are permitted.
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
    }),
  );

  app.use(express.json({ limit: '15mb' })); // headroom for base64 image payloads

  // Generous global rate limit on the whole API (per IP).
  app.use('/api', globalLimiter);

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
