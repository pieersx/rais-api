import express from 'express';
import cors from 'cors';
import { oaiRouter } from './routes/oai.routes.js';

const app = express();

// --------------- Middlewares globales ---------------
app.use(cors());
app.use(express.json());

// --------------- Rutas ---------------
app.use('/api/oai', oaiRouter);

// --------------- Health check ---------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --------------- 404 ---------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --------------- Error handler global ---------------
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.statusCode ?? 500).json({
    error: {
      code: err.oaiCode ?? 'internalError',
      message: err.message ?? 'Internal server error',
    },
  });
});

export { app };
