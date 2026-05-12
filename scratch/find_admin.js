
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function findAdmin() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query("SELECT email, password, role FROM users WHERE role = 'admin' LIMIT 5");
    console.log('Admin Users Found:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error querying users:', err);
  } finally {
    await client.end();
  }
}

findAdmin();
