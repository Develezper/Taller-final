import app from './app.js';
import env from './config/env.js';
import { pool } from './config/db.js';

async function start() {
  try {
    await pool.query('SELECT 1');
    app.listen(env.PORT, () => {
      const baseUrl = `http://127.0.0.1:${env.PORT}`;
      // eslint-disable-next-line no-console
      console.log(`Backend API corriendo en: ${baseUrl}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('No fue posible iniciar la API:', error.message);
    process.exit(1);
  }
}

start();
