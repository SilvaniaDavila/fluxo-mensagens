const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'data', 'mensagens.json');
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(express.json());

// Funções utilitárias
function lerMensagens() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function salvarMensagens(mensagens) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(mensagens, null, 2), 'utf8');
}

// Rota: buscar por atalho exato
app.get('/api/mensagem/:atalho', (req, res) => {
  const mensagens = lerMensagens();
  const atalho = req.params.atalho.toLowerCase();
  res.json({ mensagem: mensagens[atalho] || null });
});

// Rota: buscar atalhos por prefixo (flexível)
app.get('/api/atalhos/:prefixo', (req, res) => {
  const mensagens = lerMensagens();
  const prefixo = req.params.prefixo.toLowerCase();
  const resultados = Object.keys(mensagens).filter(a => a.includes(prefixo));
  res.json({ atalhos: resultados });
});

// Rota: adicionar novo atalho
app.post('/api/atalho', (req, res) => {
  const { atalho, mensagem } = req.body;
  if (!atalho || !mensagem) return res.status(400).json({ error: 'Atalho e mensagem são obrigatórios' });

  const mensagens = lerMensagens();
  const chave = atalho.toLowerCase();

  if (mensagens[chave]) return res.status(409).json({ error: 'Atalho já existe' });

  mensagens[chave] = mensagem;
  salvarMensagens(mensagens);
  res.json({ sucesso: true, atalho: chave });
});

// Rota: alterar atalho
app.put('/api/atalho', (req, res) => {
  const { atalho, mensagem } = req.body;
  if (!atalho || !mensagem) return res.status(400).json({ error: 'Atalho e mensagem são obrigatórios' });

  const mensagens = lerMensagens();
  const chave = atalho.toLowerCase();

  if (!mensagens[chave]) return res.status(404).json({ error: 'Atalho não encontrado' });

  mensagens[chave] = mensagem;
  salvarMensagens(mensagens);
  res.json({ sucesso: true });
});

// Rota: importar CSV (robusta com nomes flexíveis)
app.post('/api/importar-csv', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo CSV enviado' });

  const filePath = path.join(__dirname, 'uploads', req.file.filename);
  const mensagens = lerMensagens();
  let total = 0;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      // Normaliza os nomes das colunas
      const colunas = Object.keys(row).reduce((acc, key) => {
        acc[key.trim().toLowerCase()] = key;
        return acc;
      }, {});

      const atalho = row[colunas["atalho"]]?.trim();
      const mensagem = row[colunas["texto"]]?.trim();

      if (atalho && mensagem) {
        mensagens[atalho.toLowerCase()] = mensagem;
        total++;
      }
    })
    .on('end', () => {
      salvarMensagens(mensagens);
      fs.unlinkSync(filePath);
      res.json({ message: 'Importação concluída', total });
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'Erro ao ler CSV: ' + err.message });
    });
});

// Rota opcional para debug (ver mensagens carregadas)
app.get('/api/debug', (req, res) => {
  res.json(lerMensagens());
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
