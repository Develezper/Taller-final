import express from 'express';
import autoRoutes from './routes/autoRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import importRoutes from './routes/importRoutes.js';
import { HttpError } from './utils/errors.js';

const app = express();

app.use(express.json());

app.use('/api/autos', autoRoutes);
app.use('/api/transacciones', transactionRoutes);
app.use('/api/import', importRoutes);

app.use((req, res, next) => {
  next(new HttpError(404, 'Ruta no encontrada'));
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const isClientError = status >= 400 && status < 500;

  if (!isClientError) {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', error);
  }

  res.status(status).json({
    error: isClientError ? error.message : 'Error interno del servidor',
    details: isClientError ? error.details || null : null,
  });
});

export default app;
