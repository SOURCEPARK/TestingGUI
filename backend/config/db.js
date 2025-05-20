import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // 用于从 .env 文件加载环境变量

const pool = new Pool({
  host: POSTGRES_HOST, // Hostname des Datenbank-Containers (siehe docker-compose)
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};