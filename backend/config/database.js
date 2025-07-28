const { Pool } = require('pg');
require('dotenv').config();


let pool;

const connectDB = async () => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    

    const client = await pool.connect();
    console.log('✅ Database connection established');
    client.release();

    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return pool;
};

const query = async (text, params) => {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};

const transaction = async (callback) => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  connectDB,
  getPool,
  query,
  transaction,
};
