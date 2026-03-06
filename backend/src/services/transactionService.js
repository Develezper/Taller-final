import { withTransaction } from '../config/db.js';
import { HttpError } from '../utils/errors.js';
import {
  normalizePlate,
  normalizeText,
  parseIsoDate,
  parsePositiveNumber,
  upsertPerson,
  fetchVehicleByPlate,
} from './vehicleShared.js';

function validatePurchaseInput(input) {
  const placa = normalizePlate(input.placa);
  const nombreVendedor = normalizeText(input.nombreVendedor);
  const telefonoVendedor = normalizeText(input.telefonoVendedor);
  const fechaIngreso = parseIsoDate(input.fechaIngreso, 'fechaIngreso');
  const precioCompra = parsePositiveNumber(input.precioCompra, 'precioCompra');

  if (!placa || !nombreVendedor || !telefonoVendedor || !fechaIngreso) {
    throw new HttpError(
      400,
      'placa, nombreVendedor, telefonoVendedor y fechaIngreso son obligatorios'
    );
  }

  return {
    placa,
    nombreVendedor,
    telefonoVendedor,
    fechaIngreso,
    precioCompra,
  };
}

async function registerPurchase(input) {
  const payload = validatePurchaseInput(input);

  return withTransaction(async (connection) => {
    const [vehicleRows] = await connection.execute('SELECT id FROM vehicles WHERE plate = ?', [
      payload.placa,
    ]);
    if (vehicleRows.length === 0) {
      throw new HttpError(404, 'Auto no encontrado');
    }

    const vehicleId = vehicleRows[0].id;
    const [purchaseRows] = await connection.execute(
      'SELECT id FROM purchases WHERE vehicle_id = ?',
      [vehicleId]
    );
    if (purchaseRows.length > 0) {
      throw new HttpError(409, 'Este auto ya tiene una compra registrada');
    }

    const sellerId = await upsertPerson(
      connection,
      payload.nombreVendedor,
      payload.telefonoVendedor
    );

    await connection.execute(
      `INSERT INTO purchases (vehicle_id, seller_id, purchase_date, purchase_price)
       VALUES (?, ?, ?, ?)`,
      [vehicleId, sellerId, payload.fechaIngreso, payload.precioCompra]
    );

    return fetchVehicleByPlate(connection, payload.placa);
  });
}

function validateSaleInput(input) {
  const placa = normalizePlate(input.placa);
  const nombreComprador = normalizeText(input.nombreComprador);
  const telefonoComprador = normalizeText(input.telefonoComprador);
  const fechaVenta = parseIsoDate(input.fechaVenta, 'fechaVenta');
  const precioVenta = parsePositiveNumber(input.precioVenta, 'precioVenta');

  if (!placa || !nombreComprador || !telefonoComprador || !fechaVenta) {
    throw new HttpError(
      400,
      'placa, nombreComprador, telefonoComprador y fechaVenta son obligatorios'
    );
  }

  return {
    placa,
    nombreComprador,
    telefonoComprador,
    fechaVenta,
    precioVenta,
  };
}

async function registerSale(input) {
  const payload = validateSaleInput(input);

  return withTransaction(async (connection) => {
    const [vehicleRows] = await connection.execute('SELECT id FROM vehicles WHERE plate = ?', [
      payload.placa,
    ]);
    if (vehicleRows.length === 0) {
      throw new HttpError(404, 'Auto no encontrado');
    }

    const vehicleId = vehicleRows[0].id;
    const [purchaseRows] = await connection.execute(
      'SELECT id FROM purchases WHERE vehicle_id = ?',
      [vehicleId]
    );
    if (purchaseRows.length === 0) {
      throw new HttpError(409, 'No se puede vender un auto sin compra previa');
    }

    const [saleRows] = await connection.execute('SELECT id FROM sales WHERE vehicle_id = ?', [
      vehicleId,
    ]);
    if (saleRows.length > 0) {
      throw new HttpError(409, 'Este auto ya fue vendido');
    }

    const buyerId = await upsertPerson(
      connection,
      payload.nombreComprador,
      payload.telefonoComprador
    );

    await connection.execute(
      `INSERT INTO sales (vehicle_id, buyer_id, sale_date, sale_price)
       VALUES (?, ?, ?, ?)`,
      [vehicleId, buyerId, payload.fechaVenta, payload.precioVenta]
    );

    return fetchVehicleByPlate(connection, payload.placa);
  });
}

export {
  registerPurchase,
  registerSale,
};
