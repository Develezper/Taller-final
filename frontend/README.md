# Frontend - AutoMarket Pro

SPA built with Vite and Axios, organized by views.

## Stack

- Bun
- Vite
- JavaScript (simple SPA)
- Axios

## Views

- `#/resumen`:
  - inventory summary metrics (total, available, sold, average km)
  - brand ranking by unit count
- `#/autos`:
  - vehicle entry form
  - inventory table with filters and automatic refresh
  - paginated results (page size and previous/next navigation)
  - interactive edit and delete
- `#/importar`:
  - CSV file upload

## Structure

- `src/main.js`: hash routing and base layout
- `src/api/client.js`: Axios client
- `src/views/dashboardView.js`: summary view
- `src/views/vehiclesView.js`: vehicles view
- `src/views/importView.js`: CSV import view
- `src/styles.css`: global styles
- `vite.config.js`: `/api` proxy to backend

## Run

Run in a separate terminal, independent from backend.

```bash
bun install
bun run dev
```

Frontend URL: `http://127.0.0.1:5173`

## Backend Connection

By default it uses `'/api'` and Vite proxies requests to `http://127.0.0.1:3000`.

If you need another backend, set it in `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:3000/api
```
