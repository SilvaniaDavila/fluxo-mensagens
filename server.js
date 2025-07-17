const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'data', 'mensagens.json');
const upload = multer({ dest: 'uploads/' });  // Pasta temporária para armazenar o arquivo CSV

app.use(express.static('public'));
app.use(express.json());

// Função para ler o arquivo JSON de mensagens
function lerMensagens() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Função para salvar mensagens no arquivo JSON
function salvarMensagens(mensagens) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(mensagens, null, 2), 'utf8');
}

// Rota para retornar a mensagem do atalho exato
app.get('/api/mensagem/:atalho', (req, res) => {
  const mensagens = lerMensagens();
  const atalho = req.params.atalho.toLowerCase();
  if (mensagens[atalho]) {
    res.json({ mensagem: mensagens[atalho] });
  } else {
    res.status(404).json({ error: 'Atalho não encontrado' });
  }
});

// Rota para listar atalhos que começam com o prefixo (autocomplete flexível)
app.get('/api/atalhos/:prefixo', (req, res) => {
  const mensagens = lerMensagens();
  const prefixo = req.params.prefixo.toLowerCase();

  // Permite buscar atalhos que contenham o prefixo em qualquer parte da palavra (flexível)
  const resultados = Object.keys(mensagens).filter(a => a.toLowerCase().includes(prefixo));

  res.json({ atalhos: resultados });
});

// Rota para adicionar novo atalho
app.post('/api/atalho', (req, res) => {
  const { atalho, mensagem } = req.body;
  if (!atalho || !mensagem) {
    return res.status(400).json({ error: 'Atalho e mensagem são obrigatórios' });
  }
  const mensagens = lerMensagens();
  const chave = atalho.toLowerCase();

  if (mensagens[chave]) {
    return res.status(409).json({ error: 'Atalho já existe' });
  }

  mensagens[chave] = mensagem;
  try {
    salvarMensagens(mensagens);
    res.json({ sucesso: true, atalho: chave });
  } catch {
    res.status(500).json({ error: 'Erro ao salvar mensagem' });
  }
});

// Rota para alterar mensagem de um atalho existente
app.put('/api/atalho', (req, res) => {
  const { atalho, mensagem } = req.body;
  if (!atalho || !mensagem) {
    return res.status(400).json({ error: 'Atalho e mensagem são obrigatórios' });
  }
  const mensagens = lerMensagens();
  const chave = atalho.toLowerCase();

  if (!mensagens[chave]) {
    return res.status(404).json({ error: 'Atalho não encontrado para alterar' });
  }

  mensagens[chave] = mensagem;
  try {
    salvarMensagens(mensagens);
    res.json({ sucesso: true, atalho: chave });
  } catch {
    res.status(500).json({ error: 'Erro ao salvar mensagem' });
  }
});

// Rota para renomear um atalho existente
app.patch('/api/atalho', (req, res) => {
  const { atalhoAntigo, atalhoNovo } = req.body;
  if (!atalhoAntigo || !atalhoNovo) {
    return res.status(400).json({ error: 'Atalho antigo e novo são obrigatórios' });
  }
  const mensagens = lerMensagens();
  const oldKey = atalhoAntigo.toLowerCase();
  const newKey = atalhoNovo.toLowerCase();

  if (!mensagens[oldKey]) {
    return res.status(404).json({ error: 'Atalho antigo não encontrado' });
  }
  if (mensagens[newKey]) {
    return res.status(409).json({ error: 'Atalho novo já existe' });
  }

  mensagens[newKey] = mensagens[oldKey];
  delete mensagens[oldKey];

  try {
    salvarMensagens(mensagens);
    res.json({ sucesso: true, atalhoNovo: newKey });
  } catch {
    res.status(500).json({ error: 'Erro ao salvar mensagens' });
  }
});

// Rota para importar CSV
app.post('/api/importar-csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo CSV enviado' });
  }

  const csvFilePath = path.join(__dirname, 'uploads', req.file.filename);
  const mensagens = lerMensagens();
  let total = 0;

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      const atalho = row.Atalho.trim();  // Corrigir "Altaho" para "Atalho"
      const mensagem = row.Texto.trim(); // Verifique se o nome da coluna "Texto" está correto

      if (atalho && mensagem) {
        mensagens[atalho.toLowerCase()] = mensagem;
        total++;
      }
    })
    .on('end', () => {
      salvarMensagens(mensagens);
      fs.unlinkSync(csvFilePath);  // Apaga o arquivo temporário após o processamento
      res.json({ message: 'Importação concluída', total });
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'Erro ao ler o CSV: ' + err.message });
    });
});

// Rota padrão para abrir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
