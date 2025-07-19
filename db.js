const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',           // <-- altere se necessário
  host: 'localhost',
  database: 'mensagens',
  password: '924305', // <-- insira sua senha do PostgreSQL
  port: 5432,
});

module.exports = pool;
