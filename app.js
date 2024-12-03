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
app.get('/', async (req, res) => {
    const user = req.session.user;
    const categoria = req.query.categoria || null;
    let carrinho = req.session.carrinho || [];  // Garante que o carrinho seja um array

    // Se carrinho for undefined, inicializa-o como um array vazio
    if (!Array.isArray(carrinho)) {
        carrinho = [];
        req.session.carrinho = carrinho;  // Salva novamente na sessão
    }

    let query = 'SELECT * FROM products';
    let values = [];

    if (categoria) {
        query += ' WHERE categoria = $1';
        values = [categoria];
    }

    try {
        const result = await client.query(query, values);
        const produtos = result.rows.map(produto => {
            produto.preco = parseFloat(produto.preco);
            return produto;
        });

        // Passando o carrinho corretamente para a view
        res.render('index', { user, produtos, categoria, carrinho });  // Passando carrinho para o EJS
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
// Finalizar a compra
app.post('/comprar', async (req, res) => {
    const user = req.session.user;
    const carrinho = req.session.carrinho || [];

    if (!user) {
        return res.redirect('/login');  // Se não estiver logado, redireciona para o login
    }

    if (carrinho.length === 0) {
        return res.redirect('/cart/view');  // Se o carrinho estiver vazio, redireciona para o carrinho
    }

    try {
        // Processar a compra - Aqui você pode adicionar a lógica de inserção no banco de dados
        for (const item of carrinho) {
            await client.query(
                'INSERT INTO compras (usuario_id, produto_id, quantidade, valor_total) VALUES ($1, $2, $3, $4)',
                [user.id, item.id, item.quantidade, item.preco * item.quantidade]
            );
        }

        // Limpar o carrinho após a compra
        req.session.carrinho = [];

        res.redirect('/');  // Redireciona para a página principal após a compra
    } catch (error) {
        console.error('Erro ao processar a compra:', error);
        res.status(500).send('Erro ao processar a compra.');
    }
});


// Rota do painel de administração
app.get('/admin', async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.redirect('/login');
    }

    try {
        const result = await client.query('SELECT * FROM products');
        const produtos = result.rows;
        res.render('adminpanel', { user, produtos });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao carregar o painel de administração.');
    }
});

// Rota para adicionar um novo produto no painel administrativo
app.post('/admin/produto/adicionar', async (req, res) => {
    const { nome, descricao, preco, categoria, imagem } = req.body;

    console.log('Dados recebidos no backend:', { nome, descricao, preco, categoria, imagem });

    // Verificação para garantir que os campos obrigatórios não estão vazios
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
        res.redirect('/admin/produto/listar'); // ou onde você deseja redirecionar
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao adicionar produto.');
    }
});
// Rota para listar os produtos no painel administrativo
app.get('/admin/produto/listar', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM products');
        const produtos = result.rows.map(produto => ({
            ...produto,
            preco: parseFloat(produto.preco)
        }));

        res.render('adminpanel', { produtos });
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).send('Erro ao listar produtos');
    }
});
// Rota de compra
app.post('/comprar/:id', async (req, res) => {
    try {
        const produtoId = req.params.id; // ID do produto enviado na URL
        const quantidade = parseInt(req.body.quantidade, 10); // Quantidade enviada pelo formulário

        // Validar a quantidade
        if (isNaN(quantidade) || quantidade < 1) {
            return res.status(400).send('Quantidade inválida.');
        }

        // Exemplo de busca do produto no banco de dados (ajuste conforme seu modelo)
        const produto = await db.query('SELECT * FROM produtos WHERE id = $1', [produtoId]);
        if (produto.rows.length === 0) {
            return res.status(404).send('Produto não encontrado.');
        }

        // Calcular o valor total
        const precoUnitario = produto.rows[0].preco;
        const valorTotal = precoUnitario * quantidade;

        // Exemplo de lógica para salvar a compra no banco de dados
        await db.query(
            'INSERT INTO compras (produto_id, usuario_id, quantidade, valor_total) VALUES ($1, $2, $3, $4)',
            [produtoId, req.user.id, quantidade, valorTotal]
        );

        // Redirecionar ou enviar resposta de sucesso
        res.redirect('/'); // Redireciona de volta à página inicial após a compra
    } catch (error) {
        console.error('Erro ao processar compra:', error);
        res.status(500).send('Erro ao processar a compra.');
    }
});

// Adicionar produto ao carrinho
app.post('/cart/add/:id', (req, res) => {
    const produtoId = req.params.id;
    const quantidade = parseInt(req.body.quantidade, 10) || 1;

    // Inicializar o carrinho na sessão, se não existir
    if (!req.session.carrinho) {
        req.session.carrinho = [];
    }

    // Verificar se o produto já está no carrinho
    const itemExistente = req.session.carrinho.find(item => item.id === produtoId);

    if (itemExistente) {
        // Atualizar a quantidade se o produto já estiver no carrinho
        itemExistente.quantidade += quantidade;
    } else {
        // Adicionar novo item ao carrinho
        req.session.carrinho.push({
            id: produtoId,
            nome: req.body.nome,
            preco: parseFloat(req.body.preco),
            quantidade: quantidade
        });
    }

    res.redirect('/cart/view'); // Redirecionar para a página do carrinho
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
