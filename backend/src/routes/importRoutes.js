import express from 'express';
import multer from 'multer';
import { parseCsv } from '../utils/csv.js';
import { importCsvRows } from '../services/vehicleService.js';
import { asyncHandler, HttpError } from '../utils/errors.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      cb(new HttpError(400, 'Solo se permiten archivos .csv'));
      return;
    }
    cb(null, true);
  },
});

router.post(
  '/csv',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, 'Debes enviar el archivo en el campo file');
    }

    const content = req.file.buffer.toString('utf8');
    const rows = parseCsv(content);
    if (rows.length === 0) {
      throw new HttpError(400, 'El archivo CSV no tiene filas de datos');
    }

    const summary = await importCsvRows(rows);
    res.status(201).json(summary);
  })
);

export default router;
