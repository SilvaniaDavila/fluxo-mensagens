const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'data', 'mensagens.json');

app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz - serve index.html da pasta public
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API que retorna mensagem pelo atalho exato (antiga)
app.get('/api/mensagem/:atalho', (req, res) => {
  const atalho = req.params.atalho.toLowerCase();

  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler arquivo de mensagens:', err);
      return res.status(500).json({ error: 'Erro ao ler mensagens' });
    }

    let mensagens;
    try {
      mensagens = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: 'Erro ao processar mensagens' });
    }

    const mensagem = mensagens[atalho];
    if (!mensagem) {
      return res.status(404).json({ error: 'Mensagem não encontrada para o atalho informado' });
    }

    res.json({ mensagem });
  });
});

// NOVA rota para retornar todas as mensagens (para busca flexível no frontend)
app.get('/api/mensagem', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler arquivo de mensagens:', err);
      return res.status(500).json({ error: 'Erro ao ler mensagens' });
    }
    let mensagens = {};
    try {
      mensagens = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: 'Erro ao processar mensagens' });
    }
    res.json(mensagens);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
