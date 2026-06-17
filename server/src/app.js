import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Express app, exported separately from the listener so it can be imported by
// tests or a serverless adapter without binding a port.
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '15mb' })); // headroom for base64 image payloads

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
