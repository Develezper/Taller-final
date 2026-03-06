import { pool } from '../config/db.js';
import { HttpError } from '../utils/errors.js';
import {
  normalizePlate,
  normalizeText,
  parseNonNegativeInt,
  validateVehicleCondition,
  fetchVehicleByPlate,
} from './vehicleShared.js';

async function findVehicleByPlate(placa) {
  return fetchVehicleByPlate(pool, placa);
}

async function listVehicles(filters = {}) {
  let sql = `
    SELECT
      v.plate AS placa,
      v.brand AS marca,
      v.color,
      v.vehicle_condition AS estado_vehiculo,
      v.mileage AS kilometraje,
      p.purchase_date AS fecha_ingreso,
      p.purchase_price AS precio_compra,
      seller.full_name AS nombre_vendedor,
      seller.phone AS telefono_vendedor,
      s.sale_date AS fecha_venta,
      s.sale_price AS precio_venta,
      buyer.full_name AS nombre_comprador,
      buyer.phone AS telefono_comprador,
      CASE WHEN s.id IS NULL THEN 'Disponible' ELSE 'Vendido' END AS estado_operacion,
      CASE WHEN s.id IS NULL THEN NULL ELSE (s.sale_price - p.purchase_price) END AS ganancia
    FROM vehicles v
    LEFT JOIN purchases p ON p.vehicle_id = v.id
    LEFT JOIN people seller ON seller.id = p.seller_id
    LEFT JOIN sales s ON s.vehicle_id = v.id
    LEFT JOIN people buyer ON buyer.id = s.buyer_id
    WHERE 1 = 1`;

  const params = [];

  if (filters.placa) {
    sql += ' AND v.plate = ?';
    params.push(normalizePlate(filters.placa));
  }

  if (filters.estadoOperacion === 'Vendido') {
    sql += ' AND s.id IS NOT NULL';
  }

  if (filters.estadoOperacion === 'Disponible') {
    sql += ' AND s.id IS NULL';
  }

  sql += ' ORDER BY v.id DESC';

  const [rows] = await pool.execute(sql, params);
  return rows;
}

function validateCreateVehicleInput(input) {
  const placa = normalizePlate(input.placa);
  const marca = normalizeText(input.marca);
  const color = normalizeText(input.color);
  const estadoVehiculo = normalizeText(input.estadoVehiculo);
  const kilometraje = parseNonNegativeInt(input.kilometraje, 'kilometraje');

  if (!placa || !marca || !color || !estadoVehiculo) {
    throw new HttpError(400, 'placa, marca, color y estadoVehiculo son obligatorios');
  }

  validateVehicleCondition(estadoVehiculo);

  return { placa, marca, color, estadoVehiculo, kilometraje };
}

async function createVehicle(input) {
  const payload = validateCreateVehicleInput(input);

  try {
    await pool.execute(
      `INSERT INTO vehicles (plate, brand, color, vehicle_condition, mileage)
       VALUES (?, ?, ?, ?, ?)`,
      [payload.placa, payload.marca, payload.color, payload.estadoVehiculo, payload.kilometraje]
    );

    return findVehicleByPlate(payload.placa);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'La placa ya existe');
    }
    throw error;
  }
}

async function updateVehicle(placa, input) {
  const plate = normalizePlate(placa);
  if (!plate) {
    throw new HttpError(400, 'placa invalida');
  }

  const fields = [];
  const values = [];

  if (input.marca !== undefined) {
    const marca = normalizeText(input.marca);
    if (!marca) {
      throw new HttpError(400, 'marca no puede ser vacio');
    }
    fields.push('brand = ?');
    values.push(marca);
  }

  if (input.color !== undefined) {
    const color = normalizeText(input.color);
    if (!color) {
      throw new HttpError(400, 'color no puede ser vacio');
    }
    fields.push('color = ?');
    values.push(color);
  }

  if (input.estadoVehiculo !== undefined) {
    const estadoVehiculo = normalizeText(input.estadoVehiculo);
    validateVehicleCondition(estadoVehiculo);
    fields.push('vehicle_condition = ?');
    values.push(estadoVehiculo);
  }

  if (input.kilometraje !== undefined) {
    const kilometraje = parseNonNegativeInt(input.kilometraje, 'kilometraje');
    fields.push('mileage = ?');
    values.push(kilometraje);
  }

  if (fields.length === 0) {
    throw new HttpError(400, 'Debe enviar al menos un campo a actualizar');
  }

  values.push(plate);
  const [result] = await pool.execute(
    `UPDATE vehicles
     SET ${fields.join(', ')}
     WHERE plate = ?`,
    values
  );

  if (result.affectedRows === 0) {
    throw new HttpError(404, 'Auto no encontrado');
  }

  return findVehicleByPlate(plate);
}

async function deleteVehicle(placa) {
  const plate = normalizePlate(placa);

  const [vehicleRows] = await pool.execute('SELECT id FROM vehicles WHERE plate = ?', [plate]);
  if (vehicleRows.length === 0) {
    throw new HttpError(404, 'Auto no encontrado');
  }

  const vehicleId = vehicleRows[0].id;
  const [[checks]] = await pool.execute(
    `SELECT
      EXISTS(SELECT 1 FROM purchases WHERE vehicle_id = ?) AS has_purchase,
      EXISTS(SELECT 1 FROM sales WHERE vehicle_id = ?) AS has_sale`,
    [vehicleId, vehicleId]
  );

  if (checks.has_purchase || checks.has_sale) {
    throw new HttpError(
      409,
      'No se puede eliminar: el auto tiene transacciones asociadas (compra/venta)'
    );
  }

  await pool.execute('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
}

export {
  listVehicles,
  findVehicleByPlate,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
