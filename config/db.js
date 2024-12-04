const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://loja_catolica_owner:Ewv6Q8ruLIJk@ep-rough-scene-a5i58s64.us-east-2.aws.neon.tech/loja_catolica?sslmode=require',
    ssl: {
        rejectUnauthorized: false // Necessário para conexões seguras no Neon
    },
});

client.connect()
    .then(() => {
        console.log('Conexão com o banco de dados Neon estabelecida com sucesso');
    })
    .catch(err => {
        console.error('Erro ao conectar com o banco de dados Neon:', err);
    });

module.exports = client;
