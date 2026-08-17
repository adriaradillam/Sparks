import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// La conexión real a la base de datos PostgreSQL
export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sparks_db',
  password: process.env.DB_PASSWORD || 'tu_contraseña',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Función auxiliar para comprobar la conexión sin colgar el servidor
export const checkConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado a la base de datos PostgreSQL.');
    client.release();
    return true;
  } catch (err) {
    console.log('⚠️ No se pudo conectar a la base de datos. Asegúrate de tener PostgreSQL encendido.');
    return false;
  }
};
