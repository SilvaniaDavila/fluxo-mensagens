const pool = require('./db'); // seu arquivo de conexão com o PG
const mensagens = require('./data/mensagens.json'); // seu arquivo JSON

async function importarMensagens() {
  for (const msg of mensagens) {
    try {
      await pool.query(
        'INSERT INTO mensagens (atalho, mensagem) VALUES ($1, $2)',
        [msg.atalho, msg.texto]
      );
      console.log(`Inserido: ${msg.atalho}`);
    } catch (err) {
      console.error('Erro ao inserir:', err);
    }
  }
  console.log('Importação concluída!');
  pool.end();
}

importarMensagens();
