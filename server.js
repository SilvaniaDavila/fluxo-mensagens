const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve arquivos estáticos da pasta 'public' (inclui index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Arquivo JSON com as mensagens
const DATA_FILE = path.join(__dirname, 'data', 'mensagens.json');

// Rota raiz que serve o index.html explicitamente (opcional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Buscar mensagem pelo atalho exato
app.get('/api/mensagem/:atalho', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler mensagens' });

    let mensagens = {};
    try {
      mensagens = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Erro ao processar mensagens' });
    }

    const atalho = req.params.atalho;
    const mensagem = mensagens[atalho];

    if (mensagem) {
      res.json({ mensagem });
    } else {
      res.status(404).json({ error: 'Mensagem não encontrada' });
    }
  });
});

// Busca flexível - retorna todos os atalhos que contenham o texto pesquisado
app.get('/api/mensagens/buscar/:query', (req, res) => {
  const query = req.params.query.toLowerCase();

  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler mensagens' });

    let mensagens = {};
    try {
      mensagens = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: 'Erro ao processar mensagens' });
    }

    const resultados = Object.keys(mensagens)
      .filter(atalho => atalho.toLowerCase().includes(query))
      .map(atalho => ({ atalho, mensagem: mensagens[atalho] }));

    res.json(resultados);
  });
});

// Adicionar nova mensagem
app.post('/api/mensagem', (req, res) => {
  const { atalho, mensagem } = req.body;

  if (!atalho || !mensagem) {
    return res.status(400).json({ error: 'atalho e mensagem são obrigatórios' });
  }

  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler mensagens' });

    let mensagens = {};
    try {
      mensagens = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Erro ao processar mensagens' });
    }

    mensagens[atalho] = mensagem;

    fs.writeFile(DATA_FILE, JSON.stringify(mensagens, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Erro ao salvar mensagem' });

      res.json({ message: 'Mensagem salva com sucesso' });
    });
  });
});

// Deletar um atalho
app.delete('/api/mensagem/:atalho', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler mensagens' });

    let mensagens = {};
    try {
      mensagens = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Erro ao processar mensagens' });
    }

    const atalho = req.params.atalho;

    if (!(atalho in mensagens)) {
      return res.status(404).json({ error: 'Atalho não encontrado' });
    }

    delete mensagens[atalho];

    fs.writeFile(DATA_FILE, JSON.stringify(mensagens, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Erro ao salvar mensagens' });

      res.json({ message: 'Atalho deletado com sucesso' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
