const express = require('express');
const path = require('path');
const pool = require('./db'); // usa a conexão do db.js

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static('public'));
app.use(express.json());

// 🔍 GET mensagem por atalho exato
app.get('/api/mensagem/:atalho', async (req, res) => {
  const atalho = req.params.atalho.toLowerCase();
  try {
    const result = await pool.query(
      'SELECT mensagem FROM mensagens WHERE LOWER(atalho) = $1',
      [atalho]
    );
    if (result.rows.length > 0) {
      res.json({ mensagem: result.rows[0].mensagem });
    } else {
      res.status(404).json({ error: 'Atalho não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 GET lista de atalhos por prefixo (autocomplete flexível)
app.get('/api/atalhos/:prefixo', async (req, res) => {
  const prefixo = req.params.prefixo.toLowerCase();
  try {
    const result = await pool.query(
      "SELECT atalho FROM mensagens WHERE LOWER(atalho) LIKE '%' || $1 || '%'",
      [prefixo]
    );
    const atalhos = result.rows.map(row => row.atalho);
    res.json({ atalhos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ POST novo atalho
app.post('/api/atalho', async (req, res) => {
  const { atalho, mensagem } = req.body;
  if (!atalho || !mensagem) {
    return res.status(400).json({ error: 'Atalho e mensagem são obrigatórios' });
  }

  try {
    const exists = await pool.query(
      'SELECT id FROM mensagens WHERE LOWER(atalho) = $1',
      [atalho.toLowerCase()]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Atalho já existe' });
    }

    await pool.query(
      'INSERT INTO mensagens (atalho, mensagem) VALUES ($1, $2)',
      [atalho, mensagem]
    );
    res.json({ sucesso: true, atalho });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ PUT alterar mensagem de um atalho existente
app.put('/api/atalho', async (req, res) => {
  const { atalho, mensagem } = req.body;
  if (!atalho || !mensagem) {
    return res.status(400).json({ error: 'Atalho e mensagem são obrigatórios' });
  }

  try {
    const result = await pool.query(
      'UPDATE mensagens SET mensagem = $1 WHERE LOWER(atalho) = $2',
      [mensagem, atalho.toLowerCase()]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Atalho não encontrado' });
    }

    res.json({ sucesso: true, atalho });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔁 PATCH renomear um atalho
app.patch('/api/atalho', async (req, res) => {
  const { atalhoAntigo, atalhoNovo } = req.body;
  if (!atalhoAntigo || !atalhoNovo) {
    return res.status(400).json({ error: 'Atalho antigo e novo são obrigatórios' });
  }

  try {
    const existeNovo = await pool.query(
      'SELECT id FROM mensagens WHERE LOWER(atalho) = $1',
      [atalhoNovo.toLowerCase()]
    );
    if (existeNovo.rows.length > 0) {
      return res.status(409).json({ error: 'Atalho novo já existe' });
    }

    const result = await pool.query(
      'UPDATE mensagens SET atalho = $1 WHERE LOWER(atalho) = $2',
      [atalhoNovo, atalhoAntigo.toLowerCase()]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Atalho antigo não encontrado' });
    }

    res.json({ sucesso: true, atalhoNovo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
