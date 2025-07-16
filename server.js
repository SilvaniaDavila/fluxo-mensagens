const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'data', 'mensagens.json');

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

  // Aqui permite buscar atalhos que contenham o prefixo em qualquer parte da palavra (flexível)
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

// Rota padrão para abrir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
