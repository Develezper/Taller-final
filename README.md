## BASE IMPLEMENTATION (BUN + MYSQL + VITE)

Implementation is split by folders:

- `backend/`: Express API, MySQL connection, and CSV import.
- `frontend/`: Vite SPA organized by views using `axios`.
- `vehiculos_taller_80_filas.csv`: sample import data.

### Module documentation

- Backend: `backend/README.md`
- Frontend: `frontend/README.md`

### 1) Create MySQL schema

```bash
mysql -u develezper -p < backend/sql/schema.sql
```

### 2) Start backend with Bun

Terminal 1:

```bash
cd backend
bun install
bun run start
```

### 3) Start frontend SPA with Vite

Terminal 2:

```bash
cd frontend
bun install
bun run dev
```

Open in browser:

```txt
http://127.0.0.1:5173
```

### 4) Views and Part 7 coverage

- View `#/resumen`: inventory summary metrics.
- View `#/autos`: vehicle form + inventory table + edit/delete.
- View `#/autos`: pagination and filters.
- View `#/importar`: CSV upload component.

### 5) API endpoints

- `GET /api/autos`
- `GET /api/autos/:placa`
- `POST /api/autos`
- `PUT /api/autos/:placa`
- `DELETE /api/autos/:placa`
- `POST /api/transacciones/compras`
- `POST /api/transacciones/ventas`
- `POST /api/import/csv` (`form-data`, field `file`)
