import express from 'express';
import {
  listVehicles,
  findVehicleByPlate,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../services/vehicleService.js';
import { asyncHandler, HttpError } from '../utils/errors.js';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const autos = await listVehicles({
      placa: req.query.placa,
      estadoOperacion: req.query.estado_operacion,
    });
    res.json(autos);
  })
);

router.get(
  '/:placa',
  asyncHandler(async (req, res) => {
    const auto = await findVehicleByPlate(req.params.placa);
    if (!auto) {
      throw new HttpError(404, 'Auto no encontrado');
    }
    res.json(auto);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const created = await createVehicle(req.body);
    res.status(201).json(created);
  })
);

router.put(
  '/:placa',
  asyncHandler(async (req, res) => {
    const updated = await updateVehicle(req.params.placa, req.body);
    res.json(updated);
  })
);

router.delete(
  '/:placa',
  asyncHandler(async (req, res) => {
    await deleteVehicle(req.params.placa);
    res.status(204).send();
  })
);

export default router;
