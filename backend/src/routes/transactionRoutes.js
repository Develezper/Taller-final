import express from 'express';
import { registerPurchase, registerSale } from '../services/vehicleService.js';
import { asyncHandler } from '../utils/errors.js';

const router = express.Router();

router.post(
  '/compras',
  asyncHandler(async (req, res) => {
    const updated = await registerPurchase(req.body);
    res.status(201).json(updated);
  })
);

router.post(
  '/ventas',
  asyncHandler(async (req, res) => {
    const updated = await registerSale(req.body);
    res.status(201).json(updated);
  })
);

export default router;
