require('dotenv').config();  // Carrega as variáveis do .env

const { Client } = require('pg');

// Criando o cliente de conexão com o banco de dados
const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,  // Normalmente 5432
    connectionTimeoutMillis: 10000,  // Aumenta o tempo de conexão para 10 segundos
});

// Conectando ao banco de dados
client.connect()
    .then(() => {
        console.log('Conexão com o banco de dados estabelecida com sucesso');
    })
    .catch(err => {
        console.error('Erro ao conectar com o banco de dados:', err);
    });

module.exports = client;
