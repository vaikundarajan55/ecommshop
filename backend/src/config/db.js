// src/config/db.js
// MySQL connection pool (mysql2/promise) - used across all models
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce_db_live',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONN_LIMIT || '10', 10),
  queueLimit: 0,
  dateStrings: true,
});

// Helper to call a stored procedure: callProcedure('sp_name', [param1, param2])
const callProcedure = async (procName, params = []) => {
  const placeholders = params.map(() => '?').join(',');
  const sql = `CALL ${procName}(${placeholders})`;
  const [rows] = await pool.query(sql, params);
  // Stored procedures return an array of resultsets; first one is usually the data
  return rows[0];
};

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('[DB] MySQL connected successfully.');
    conn.release();
  } catch (err) {
    console.error('[DB] MySQL connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, callProcedure, testConnection };
