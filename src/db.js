const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    return;
  }
  console.log('✅ Conectado a PostgreSQL (Supabase)');
  release();
});

module.exports = pool;