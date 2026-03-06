import { HttpError } from '../utils/errors.js';

function normalizePlate(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeText(value) {
  return String(value || '').trim();
}

function parsePositiveNumber(value, fieldName) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new HttpError(400, `${fieldName} debe ser un numero positivo`);
  }
  return numberValue;
}

function parseNonNegativeInt(value, fieldName) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new HttpError(400, `${fieldName} debe ser un entero >= 0`);
  }
  return numberValue;
}

function parseIsoDate(value, fieldName) {
  const dateText = normalizeText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    throw new HttpError(400, `${fieldName} debe tener formato YYYY-MM-DD`);
  }

  const parsedDate = new Date(`${dateText}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dateText) {
    throw new HttpError(400, `${fieldName} no es una fecha valida`);
  }

  return dateText;
}

function validateVehicleCondition(value) {
  if (!['Nuevo', 'Usado'].includes(value)) {
    throw new HttpError(400, 'estadoVehiculo debe ser "Nuevo" o "Usado"');
  }
}

function mapVehicleRow(row) {
  return {
    placa: row.placa,
    marca: row.marca,
    color: row.color,
    estadoVehiculo: row.estado_vehiculo,
    kilometraje: row.kilometraje,
    fechaIngreso: row.fecha_ingreso,
    precioCompra: row.precio_compra,
    nombreVendedor: row.nombre_vendedor,
    telefonoVendedor: row.telefono_vendedor,
    fechaVenta: row.fecha_venta,
    precioVenta: row.precio_venta,
    nombreComprador: row.nombre_comprador,
    telefonoComprador: row.telefono_comprador,
    estadoOperacion: row.estado_operacion,
  };
}

async function upsertPerson(connection, fullName, phone) {
  const name = normalizeText(fullName);
  const normalizedPhone = normalizeText(phone);

  if (!name || !normalizedPhone) {
    throw new HttpError(400, 'nombre y telefono de persona son obligatorios');
  }

  const [result] = await connection.execute(
    `INSERT INTO people (full_name, phone)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name),
       id = LAST_INSERT_ID(id)`,
    [name, normalizedPhone]
  );

  return result.insertId;
}

const VEHICLE_SELECT_SQL = `
  SELECT
    v.id,
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
  WHERE v.plate = ?`;

async function fetchVehicleByPlate(executor, placa) {
  const [rows] = await executor.execute(VEHICLE_SELECT_SQL, [normalizePlate(placa)]);
  return rows[0] || null;
}

export {
  normalizePlate,
  normalizeText,
  parsePositiveNumber,
  parseNonNegativeInt,
  parseIsoDate,
  validateVehicleCondition,
  mapVehicleRow,
  upsertPerson,
  fetchVehicleByPlate,
};
