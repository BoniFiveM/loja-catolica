// /routes/index.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Rota para a página inicial
router.get('/', productController.getProducts);

// Outras rotas para login, registro e carrinho podem ser adicionadas aqui

module.exports = router;
