import pkg from 'pg';
const { Pool } = pkg;

let pool = null;

export function initializeDatabase() {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'therapy_support',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
  });

  pool.connect((err, client, release) => {
    if (err) {
      console.error('Error acquiring client', err.stack);
      console.error('Database connection failed. Please check your PostgreSQL configuration.');
      console.error('Make sure PostgreSQL is running and credentials in .env file are correct.');
    } else {
      console.log('Database connected successfully');
      release();
    }
  });

  return pool;
}

export function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}
