import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '.env') });

// NOW initialize database after env vars are loaded
import { initializeDatabase, getPool } from './config/database.js';
const pool = initializeDatabase();

import authRoutes from './routes/auth.js';
import moodRoutes from './routes/mood.js';
import medicationRoutes from './routes/medication.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database health check endpoint
app.get('/api/health/db', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'connected', 
      timestamp: result.rows[0].now,
      dbConfig: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        passwordSet: !!process.env.DB_PASS
      }
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      dbConfig: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        passwordSet: !!process.env.DB_PASS
      }
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/medication', medicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
