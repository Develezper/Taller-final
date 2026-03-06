import { withTransaction } from '../config/db.js';
import { HttpError } from '../utils/errors.js';
import {
  normalizePlate,
  normalizeText,
  parsePositiveNumber,
  parseNonNegativeInt,
  parseIsoDate,
  validateVehicleCondition,
  mapVehicleRow,
  upsertPerson,
} from './vehicleShared.js';

async function importOneRow(connection, csvRow) {
  const row = mapVehicleRow(csvRow);

  const placa = normalizePlate(row.placa);
  const marca = normalizeText(row.marca);
  const color = normalizeText(row.color);
  const estadoVehiculo = normalizeText(row.estadoVehiculo);
  const kilometraje = parseNonNegativeInt(row.kilometraje, 'kilometraje');

  if (!placa || !marca || !color || !estadoVehiculo) {
    throw new HttpError(400, 'Fila invalida: placa, marca, color y estado_vehiculo son requeridos');
  }

  validateVehicleCondition(estadoVehiculo);

  const [existingRows] = await connection.execute('SELECT id FROM vehicles WHERE plate = ?', [
    placa,
  ]);
  if (existingRows.length > 0) {
    return { status: 'duplicate', placa };
  }

  const [vehicleResult] = await connection.execute(
    `INSERT INTO vehicles (plate, brand, color, vehicle_condition, mileage)
     VALUES (?, ?, ?, ?, ?)`,
    [placa, marca, color, estadoVehiculo, kilometraje]
  );
  const vehicleId = vehicleResult.insertId;

  const nombreVendedor = normalizeText(row.nombreVendedor);
  const telefonoVendedor = normalizeText(row.telefonoVendedor);
  const fechaIngreso = parseIsoDate(row.fechaIngreso, 'fecha_ingreso');
  const precioCompra = parsePositiveNumber(row.precioCompra, 'precio_compra');

  if (!nombreVendedor || !telefonoVendedor || !fechaIngreso) {
    throw new HttpError(
      400,
      'Fila invalida: nombre_vendedor, telefono_vendedor y fecha_ingreso son requeridos'
    );
  }

  const sellerId = await upsertPerson(connection, nombreVendedor, telefonoVendedor);
  await connection.execute(
    `INSERT INTO purchases (vehicle_id, seller_id, purchase_date, purchase_price)
     VALUES (?, ?, ?, ?)`,
    [vehicleId, sellerId, fechaIngreso, precioCompra]
  );

  const estadoOperacion = normalizeText(row.estadoOperacion);
  const shouldCreateSale = estadoOperacion === 'Vendido' || normalizeText(row.fechaVenta).length > 0;

  if (shouldCreateSale) {
    const nombreComprador = normalizeText(row.nombreComprador);
    const telefonoComprador = normalizeText(row.telefonoComprador);
    const fechaVenta = parseIsoDate(row.fechaVenta, 'fecha_venta');
    const precioVenta = parsePositiveNumber(row.precioVenta, 'precio_venta');

    if (!nombreComprador || !telefonoComprador || !fechaVenta) {
      throw new HttpError(
        400,
        'Fila invalida: venta requiere nombre_comprador, telefono_comprador y fecha_venta'
      );
    }

    const buyerId = await upsertPerson(connection, nombreComprador, telefonoComprador);
    await connection.execute(
      `INSERT INTO sales (vehicle_id, buyer_id, sale_date, sale_price)
       VALUES (?, ?, ?, ?)`,
      [vehicleId, buyerId, fechaVenta, precioVenta]
    );
  }

  return { status: 'inserted', placa };
}

async function importCsvRows(rows) {
  const summary = {
    total: rows.length,
    inserted: 0,
    duplicates: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i += 1) {
    try {
      // Each row runs in its own transaction to allow partial import.
      const result = await withTransaction((connection) => importOneRow(connection, rows[i]));
      if (result.status === 'duplicate') {
        summary.duplicates += 1;
      } else {
        summary.inserted += 1;
      }
    } catch (error) {
      summary.errors.push({
        line: i + 2,
        message: error.message,
      });
    }
  }

  return summary;
}

export {
  importCsvRows,
};
