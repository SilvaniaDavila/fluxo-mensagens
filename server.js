const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'data', 'mensagens.json');

app.use(express.static('public'));
app.use(express.json());

// Rota para retornar a mensagem do atalho exato
app.get('/api/mensagem/:atalho', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler mensagens' });
    let mensagens;
    try {
      mensagens = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: 'Erro ao processar mensagens' });
    }
    const atalho = req.params.atalho.toLowerCase();
    if (mensagens[atalho]) {
      res.json({ mensagem: mensagens[atalho] });
    } else {
      res.status(404).json({ error: 'Atalho não encontrado' });
    }
  });
});

// Rota para listar atalhos que começam com o prefixo (autocomplete)
app.get('/api/atalhos/:prefixo', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler mensagens' });

    let mensagens = {};
    try {
      mensagens = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: 'Erro ao processar mensagens' });
    }

    const prefixo = req.params.prefixo.toLowerCase();
    const resultados = Object.keys(mensagens).filter(a => a.toLowerCase().startsWith(prefixo));

    res.json({ atalhos: resultados });
  });
});

// Rota para adicionar novo atalho
app.post('/api/atalho', (req, res) => {
  const { atalho, mensagem } = req.body;
  if (!atalho || !mensagem) {
    return res.status(400).json({ error: 'Atalho e mensagem são obrigatórios' });
  }

  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    let mensagens = {};
    if (!err) {
      try {
        mensagens = JSON.parse(data);
      } catch {
        return res.status(500).json({ error: 'Erro ao processar mensagens' });
      }
    }

    const chave = atalho.toLowerCase();
    if (mensagens[chave]) {
      return res.status(409).json({ error: 'Atalho já existe' });
    }

    mensagens[chave] = mensagem;

    fs.writeFile(DATA_FILE, JSON.stringify(mensagens, null, 2), 'utf8', err => {
      if (err) return res.status(500).json({ error: 'Erro ao salvar mensagem' });
      res.json({ sucesso: true, atalho: chave });
    });
  });
});

// Rota padrão para abrir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
