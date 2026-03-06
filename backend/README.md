# Backend - AutoMarket Pro

REST API for vehicle management, purchases, sales, and bulk CSV import.

## Stack

- Bun
- Express
- MySQL (`mysql2`)
- Multer (CSV file uploads)

## Structure

- `src/`: API source code
- `src/routes/`: HTTP routes
- `src/services/`: business logic
- `src/config/`: environment variables and DB connection
- `sql/schema.sql`: database schema
- `.env`: local configuration

## Requirements

- Bun installed
- MySQL running

## Configuration

1. Set variables in `.env`:

- `PORT`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

2. Create the schema:

```bash
mysql -u <user> -p < sql/schema.sql
```

## Run

Run it separately from the frontend.

```bash
bun install
bun run start
```

Watch mode for development:

```bash
bun run dev
```

Base API URL: `http://127.0.0.1:3000`

## Endpoints

- `GET /api/autos`
- `GET /api/autos/:placa`
- `POST /api/autos`
- `PUT /api/autos/:placa`
- `DELETE /api/autos/:placa`
- `POST /api/transacciones/compras`
- `POST /api/transacciones/ventas`
- `POST /api/import/csv` (`multipart/form-data`, `file` field)

## Multer Research (Part 5)

The Part 5 research document remains in Spanish, as requested:

- `backend/MULTER.md`

## CSV Import

Expected CSV headers:

- `placa`
- `marca`
- `color`
- `estado_vehiculo`
- `kilometraje`
- `nombre_vendedor`
- `telefono_vendedor`
- `nombre_comprador`
- `telefono_comprador`
- `fecha_ingreso`
- `fecha_venta`
- `precio_compra`
- `precio_venta`
- `ganancia`
- `estado_operacion`
