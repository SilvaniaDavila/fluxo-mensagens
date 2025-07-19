const fs = require('fs');
const pool = require('./db'); // seu arquivo de conexão com o banco

async function importarMensagens() {
  // Ler o arquivo JSON com as mensagens
  const data = fs.readFileSync('./data/mensagens.json', 'utf8');
  const mensagens = JSON.parse(data);

  for (const m of mensagens) {
    const atalho = String(m.Atalho); // converte para texto, para evitar problemas
    const texto = m.Texto;

    try {
      // Inserir no banco, sem criar duplicados
      await pool.query(
        `INSERT INTO mensagens (atalho, mensagem)
         VALUES ($1, $2)
         ON CONFLICT (atalho) DO NOTHING`, // aqui evita erro se já existir o atalho
        [atalho, texto]
      );
      console.log(`Inserido: ${atalho}`);
    } catch (err) {
      console.error('Erro ao inserir:', err);
    }
  }

  console.log('Importação concluída!');
  process.exit();
}

importarMensagens();
