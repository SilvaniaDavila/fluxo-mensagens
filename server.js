const express = require('express');
const cors = require('cors');
const pool = require('./db');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

app.get('/api/mensagem/:atalho', async (req, res) => {
  const atalho = req.params.atalho;
  try {
    const result = await pool.query('SELECT texto FROM mensagens WHERE atalho = $1', [atalho]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Atalho não encontrado' });
    }
    res.json({ mensagem: result.rows[0].texto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar mensagem' });
  }
});

app.post('/api/adicionar', async (req, res) => {
  const { atalho, texto } = req.body;
  try {
    const exists = await pool.query('SELECT 1 FROM mensagens WHERE atalho = $1', [atalho]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ erro: 'Atalho já existe' });
    }
    await pool.query('INSERT INTO mensagens (atalho, texto) VALUES ($1, $2)', [atalho, texto]);
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao adicionar mensagem' });
  }
});

app.put('/api/alterar/:atalho', async (req, res) => {
  const { texto } = req.body;
  const atalho = req.params.atalho;
  try {
    const result = await pool.query('UPDATE mensagens SET texto = $1 WHERE atalho = $2', [texto, atalho]);
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Atalho não encontrado para alteração' });
    }
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao alterar mensagem' });
  }
});

app.post('/api/importar', upload.single('arquivo'), async (req, res) => {
  const filePath = req.file.path;
  const mensagens = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      mensagens.push(data);
    })
    .on('end', async () => {
      try {
        for (const msg of mensagens) {
          await pool.query(
            'INSERT INTO mensagens (atalho, texto) VALUES ($1, $2) ON CONFLICT (atalho) DO UPDATE SET texto = EXCLUDED.texto',
            [msg.atalho, msg.texto]
          );
        }
        fs.unlinkSync(filePath);
        res.json({ sucesso: true });
      } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao importar CSV' });
      }
    });
});

app.get('/api/exportar', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM mensagens');
    const csvData = ['atalho,texto\n', ...resultado.rows.map(r => `${r.atalho},"${r.texto.replace(/"/g, '""')}"`)].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=mensagens.csv');
    res.send(csvData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao exportar CSV' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
