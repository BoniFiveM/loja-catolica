//app.js

const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const client = require('./config/db');  // Importando o client configurado

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração da sessão
app.use(session({
    secret: 'xmania_secret',
    resave: false,
    saveUninitialized: true
}));

// Configuração do connect-flash
app.use(flash());

// Rota principal (sem carrinho)
// Rota principal (sem carrinho)
app.get('/', async (req, res) => {
    const user = req.session.user;
    const categorias = ['Lançamentos', 'Destaques do Mês', 'Imagens', 'Camisetas', 'Acessórios', 'Canecas', 'Liturgias'];

    const categoria = req.query.categoria || 'Todos';  // Se não houver categoria na query, mostra todos

    try {
        const productsByCategory = {};
        const query = categoria === 'Todos' 
            ? 'SELECT * FROM products' 
            : 'SELECT * FROM products WHERE categoria = $1';
        const values = categoria === 'Todos' ? [] : [categoria];

        const result = await client.query(query, values);

        for (let categoria of categorias) {
            const filteredProducts = result.rows.filter(produto => produto.categoria === categoria);
            productsByCategory[categoria] = filteredProducts.map(produto => ({
                ...produto,
                preco: parseFloat(produto.preco)
            }));
        }

        // Passa o carrinho da sessão para a view
        res.render('index', { user, productsByCategory, categorias, categoria, carrinho: req.session.carrinho });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar os produtos.');
    }
});




// Rota de registro
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir o usuário no banco de dados
        await client.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
            [name, email, hashedPassword]
        );

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao registrar.');
    }
});

// Ao fazer login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send('Email e senha são obrigatórios.');
    }

    try {
        const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.send('Usuário não encontrado.');
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.send('Senha incorreta.');
        }

        req.session.user = { id: user.id, name: user.name };

        res.redirect('/'); // Redireciona para a página principal
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao fazer login.');
    }
});

// Rota de logout
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Erro ao deslogar');
        }
        res.redirect('/'); // Redireciona para a página inicial
    });
});

// Rota do painel de administração
app.get('/admin', async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.redirect('/login'); // Redireciona para login caso o usuário não esteja logado
    }

    const categoria = req.query.categoria || 'Todos';  

    try {
        let query = 'SELECT * FROM products'; 
        let values = [];

        if (categoria !== 'Todos') {
            query += ' WHERE categoria = $1'; 
            values = [categoria];
        }

        const result = await client.query(query, values);
        const produtos = result.rows.map(produto => ({
            ...produto,
            preco: parseFloat(produto.preco)  
        }));

        res.render('adminpanel', { user, produtos, categoria });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar o painel de administração.');
    }
});

// Rota para adicionar um novo produto no painel administrativo
app.post('/admin/produto/adicionar', async (req, res) => {
    const { nome, descricao, preco, categoria, imagem } = req.body;

    console.log('Dados recebidos no backend:', req.body);

    if (!nome || !descricao || !preco || !categoria) {
        return res.status(400).send('Todos os campos são obrigatórios!');
    }

    const precoNum = parseFloat(preco);  

    const query = `
        INSERT INTO products (nome, descricao, preco, categoria, imagem)
        VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [nome, descricao, precoNum, categoria, imagem];

    try {
        await client.query(query, values);
        res.redirect('/admin/produto/listar');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao adicionar produto.');
    }
});

// Rota para listar os produtos no painel administrativo
app.get('/admin/produto/listar', async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.redirect('/login');
    }

    const categoria = req.query.categoria || 'Todos';  

    try {
        let query = 'SELECT * FROM products';
        let values = [];

        if (categoria !== 'Todos') {
            query += ' WHERE categoria = $1'; 
            values = [categoria];
        }

        const result = await client.query(query, values);
        const produtos = result.rows.map(produto => ({
            ...produto,
            preco: parseFloat(produto.preco)  
        }));

        res.render('adminpanel', { user, produtos, categoria });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar o painel de administração.');
    }
});

// Rota para adicionar um produto ao carrinho
app.post('/adicionar-carrinho', (req, res) => {
    const { produtoId, quantidade } = req.body;
    const user = req.session.user;

    if (!user) {
        return res.status(401).send('Você precisa estar logado para adicionar ao carrinho.');
    }

    if (!produtoId || !quantidade) {
        return res.status(400).send('Produto e quantidade são obrigatórios.');
    }

    // Recupera o produto do banco de dados
    const query = 'SELECT * FROM products WHERE id = $1';
    client.query(query, [produtoId])
        .then(result => {
            const produto = result.rows[0];
            if (!produto) {
                return res.status(404).send('Produto não encontrado.');
            }

            // Verifica se o carrinho já existe na sessão
            if (!req.session.carrinho) {
                req.session.carrinho = [];
            }

            // Verifica se o produto já está no carrinho
            const produtoNoCarrinho = req.session.carrinho.find(item => item.id === produtoId);
            if (produtoNoCarrinho) {
                // Se o produto já está no carrinho, atualiza a quantidade
                produtoNoCarrinho.quantidade += quantidade;
            } else {
                // Caso contrário, adiciona o produto ao carrinho
                req.session.carrinho.push({
                    id: produto.id,
                    nome: produto.nome,
                    preco: produto.preco,
                    quantidade: quantidade
                });
            }

            // Redireciona para a página principal
            res.redirect('/');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Erro ao adicionar produto ao carrinho.');
        });
});
// Função para buscar um produto por ID no banco de dados
const buscarProdutoPorId = async (id) => {
    try {
        const result = await client.query('SELECT * FROM products WHERE id = $1', [id]);
        return result.rows[0]; // Retorna o primeiro produto encontrado
    } catch (error) {
        console.error('Erro ao buscar produto por ID:', error);
        throw error;
    }
};

// Rota para exibir o produto
// Rota para exibir o produto
app.get('/produto/:id', async (req, res) => {
    try {
        const produto = await buscarProdutoPorId(req.params.id); // Agora a função está implementada
        if (!produto) {
            return res.status(404).send('Produto não encontrado.');
        }

        // Certifique-se de incluir `req.session.carrinho` no contexto da renderização
        res.render('produto', { 
            produto, 
            user: req.session.user || null, 
            carrinho: req.session.carrinho || [] // Passa o carrinho para a view, mesmo que vazio
        });
    } catch (error) {
        console.error('Erro ao carregar o produto:', error);
        res.status(500).send('Erro ao carregar o produto.');
    }
});






// Rota para exibir o carrinho
app.get('/carrinho', (req, res) => {
    const user = req.session.user;
    const carrinho = req.session.carrinho || [];

    res.render('carrinho', { user, carrinho });
});


app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
