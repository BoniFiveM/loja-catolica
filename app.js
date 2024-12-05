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
// Rota principal (com filtro de categorias)
// Rota principal (com filtro de categorias)
app.get('/', async (req, res) => {
    const user = req.session.user;
    const carrinho = req.session.carrinho || [];
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

        res.render('index', { user, productsByCategory, categorias, carrinho, categoria });
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

// Rota de login
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
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao fazer login.');
    }
});

// Rota de logout
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Erro ao fazer logout.');
        }
        res.redirect('/');
    });
});

// Rota de compra (verificando se o usuário está logado)
app.post('/comprar', async (req, res) => {
    const user = req.session.user;
    const carrinho = req.session.carrinho || [];

    if (!user) {
        return res.status(401).json({ message: 'Usuário não logado' });  // Retorna erro se o usuário não estiver logado
    }

    if (carrinho.length === 0) {
        return res.status(400).json({ message: 'Carrinho vazio' });  // Retorna erro se o carrinho estiver vazio
    }

    try {
        // Processar a compra - Inserir os itens no banco de dados
        for (const item of carrinho) {
            await client.query(
                'INSERT INTO compras (usuario_id, produto_id, quantidade, valor_total) VALUES ($1, $2, $3, $4)',
                [user.id, item.id, item.quantidade, item.preco * item.quantidade]
            );
        }

        // Limpar o carrinho após a compra
        req.session.carrinho = [];

        // Retorna uma resposta de sucesso com a mensagem e carrinho vazio
        res.json({
            message: 'Compra realizada com sucesso!',
            carrinho: req.session.carrinho, // Retorna o carrinho vazio após a compra
        });
    } catch (error) {
        console.error('Erro ao processar a compra:', error);
        res.status(500).json({ message: 'Erro ao processar a compra.' });
    }
});


// Rota do painel de administração
app.get('/admin', async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.redirect('/login'); // Redireciona para login caso o usuário não esteja logado
    }

    // Obtém a categoria da query string, com 'Todos' como padrão caso não haja categoria definida
    const categoria = req.query.categoria || 'Todos';  

    try {
        let query = 'SELECT * FROM products'; // Query inicial para buscar todos os produtos
        let values = [];

        // Se a categoria for diferente de 'Todos', aplica o filtro por categoria
        if (categoria !== 'Todos') {
            query += ' WHERE categoria = $1'; // Filtro para a categoria específica
            values = [categoria];
        }

        // Executa a consulta no banco de dados
        const result = await client.query(query, values);
        const produtos = result.rows.map(produto => ({
            ...produto,
            preco: parseFloat(produto.preco)  // Converte o preço para número flutuante
        }));

        // Renderiza a página adminpanel.ejs, passando os dados necessários
        res.render('adminpanel', { user, produtos, categoria });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar o painel de administração.');
    }
});


// Rota para adicionar um novo produto no painel administrativo
app.post('/admin/produto/adicionar', async (req, res) => {
    const { nome, descricao, preco, categoria, imagem } = req.body;

    console.log('Dados recebidos no backend:', req.body);  // Log para depuração

    if (!nome || !descricao || !preco || !categoria) {
        return res.status(400).send('Todos os campos são obrigatórios!');
    }

    const precoNum = parseFloat(preco);  // Garantir que o preço seja numérico

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

    const categoria = req.query.categoria || 'Todos';  // Recebe a categoria da query string ou 'Todos' como padrão

    try {
        let query = 'SELECT * FROM products';
        let values = [];

        // Se a categoria for diferente de 'Todos', aplica o filtro por categoria
        if (categoria !== 'Todos') {
            query += ' WHERE categoria = $1'; // Filtro para a categoria específica
            values = [categoria];
        }

        // Executa a consulta no banco de dados
        const result = await client.query(query, values);
        const produtos = result.rows.map(produto => ({
            ...produto,
            preco: parseFloat(produto.preco)  // Converte o preço para número flutuante
        }));

        // Renderiza a página adminpanel.ejs, passando os dados necessários
        res.render('adminpanel', { user, produtos, categoria });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar o painel de administração.');
    }
});

// Rota de compra
app.post('/comprar/:id', async (req, res) => {
    const produtoId = req.params.id;
    const { quantidade } = req.body;
    const user = req.session.user;

    if (!user) {
        return res.status(401).send('Você precisa estar logado para realizar uma compra.');
    }

    try {
        // Exemplo de uso correto do client em vez de db
        const produto = await client.query('SELECT * FROM products WHERE id = $1', [produtoId]);

        if (!produto.rows.length) {
            return res.status(404).send('Produto não encontrado.');
        }

        // Inserir no banco de dados a compra
        await client.query(
            'INSERT INTO compras (user_id, produto_id, quantidade, data_compra) VALUES ($1, $2, $3, NOW())',
            [user.id, produtoId, quantidade]
        );

        res.send('Compra realizada com sucesso!');
    } catch (error) {
        console.error('Erro ao processar compra:', error);
        res.status(500).send('Erro ao processar a compra.');
    }
});

// Adicionar produto ao carrinho
app.post('/cart/add/:id', async (req, res) => {
    const produtoId = req.params.id;
    const { nome, preco } = req.body;
    const quantidade = parseInt(req.body.quantidade, 10) || 1;

    // Inicializa o carrinho na sessão
    if (!req.session.carrinho) {
        req.session.carrinho = [];
    }

    // Verifica se o produto já está no carrinho
    const itemExistente = req.session.carrinho.find(item => item.id === produtoId);

    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        req.session.carrinho.push({
            id: produtoId,
            nome,
            preco: parseFloat(preco),
            quantidade,
        });
    }

    res.json({ success: true, carrinho: req.session.carrinho });
});



app.post('/add-to-cart', (req, res) => {
    const { produtoId, quantidade } = req.body;
    let carrinho = req.session.carrinho || [];

    // Lógica para adicionar o item no carrinho
    let itemExistente = carrinho.find(item => item.id === produtoId);
    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        carrinho.push({ id: produtoId, quantidade });
    }

    // Atualiza a sessão
    req.session.carrinho = carrinho;

    res.redirect('/');
});


// Exibir itens do carrinho
app.get('/cart/view', (req, res) => {
    const carrinho = req.session.carrinho || [];
    const user = req.session.user;

    res.render('index', {
        user,
        carrinho,
        categoria: null  // Ou defina o valor da categoria, conforme necessário
    });
});


app.get('/checkout', async (req, res) => {
    const user = req.session.user;
    const carrinho = req.session.carrinho || [];

    console.log('Acessando /checkout');
    console.log('Carrinho:', carrinho);

    if (!user) {
        req.flash('error', 'Por favor, faça login para continuar.');
        return res.redirect('/login'); // Redireciona para a página de login caso o usuário não esteja autenticado
    }

    if (carrinho.length === 0) {
        console.log('Carrinho vazio, redirecionando...');
        req.flash('error', 'Seu carrinho está vazio. Adicione itens para continuar.');
        return res.redirect('/');
    }

    try {
        const produtoIds = carrinho.map(item => item.id);
        console.log('IDs dos produtos:', produtoIds);

        const query = 'SELECT * FROM products WHERE id = ANY($1)';
        const result = await client.query(query, [produtoIds]);
        console.log('Produtos encontrados:', result.rows);

        const produtosCarrinho = carrinho.map(item => {
            const produto = result.rows.find(produto => produto.id === item.id);
            return {
                ...produto,
                quantidade: item.quantidade
            };
        });

        res.render('checkout', { user, produtosCarrinho });
    } catch (error) {
        console.error('Erro ao carregar os produtos:', error);
        req.flash('error', 'Erro ao carregar os dados do carrinho.');
        res.redirect('/'); // Redireciona para a página inicial em caso de erro
    }
});


// Porta do servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

module.exports = app;