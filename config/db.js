const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'loja_catolica',
    password: 'admin',
    port: 5432,
    connectionTimeoutMillis: 10000, // Aumenta o tempo de conexão para 10 segundos
});

client.connect()
    .then(() => {
        console.log('Conexão com o banco de dados estabelecida com sucesso');
    })
    .catch(err => {
        console.error('Erro ao conectar com o banco de dados:', err);
    });

module.exports = client;
