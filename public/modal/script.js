document.addEventListener('DOMContentLoaded', function () {
    // Modal de login
    const openModal = document.getElementById('open-login-modal');
    const modal = document.getElementById('auth-modal');
    const closeModalButton = document.getElementById('close-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');

    function openLoginModal(e) {
        e.preventDefault();
        modal.classList.remove('hidden');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    function toggleForms(showLoginForm) {
        loginForm.classList.toggle('hidden', !showLoginForm);
        registerForm.classList.toggle('hidden', showLoginForm);
        loginTab.classList.toggle('border-blue-600', showLoginForm);
        registerTab.classList.toggle('border-blue-600', !showLoginForm);
    }

    openModal?.addEventListener('click', openLoginModal);
    closeModalButton?.addEventListener('click', closeModal);
    loginTab?.addEventListener('click', () => toggleForms(true));
    registerTab?.addEventListener('click', () => toggleForms(false));
    switchToRegister?.addEventListener('click', (e) => {
        e.preventDefault();
        loginTab.click();
    });
    switchToLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        registerTab.click();
    });

    // Carrinho de compras
    const cartModal = document.getElementById('cart-modal');
    const closeCartModal = document.getElementById('close-cart-modal');
    const checkoutButton = document.getElementById('checkout-button');
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    function mostrarAlerta() {
        const alerta = document.createElement('div');
        alerta.classList.add('fixed', 'top-4', 'right-4', 'bg-green-500', 'text-white', 'p-4', 'rounded', 'shadow-lg', 'z-50');
        alerta.textContent = 'Produto adicionado ao carrinho!';
        document.body.appendChild(alerta);
        setTimeout(() => alerta.remove(), 2000);
    }

    function atualizarCarrinhoNoModal() {
        const cartProducts = document.getElementById('cart-products');
        cartProducts.innerHTML = ''; // Limpar o conteúdo atual do carrinho no modal

        if (carrinho.length > 0) {
            carrinho.forEach(function (produto) {
                const produtoElement = document.createElement('div');
                produtoElement.classList.add('flex', 'items-center', 'justify-between', 'border-b', 'pb-4');
                produtoElement.innerHTML = `
                <div class="flex items-center space-x-4">
                    <img src="${produto.imagem}" alt="${produto.nome}" class="w-16 h-16 object-cover rounded-md">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-700">${produto.nome}</h3>
                        <p class="text-sm text-gray-500">Quantidade: ${produto.quantidade}</p>
                        <p class="text-sm text-gray-500">Preço Unitário: R$ ${produto.preco ? produto.preco.toFixed(2) : 'N/A'}</p>
                    </div>
                </div>
                <p class="text-blue-600 font-bold">R$ ${(produto.preco * produto.quantidade).toFixed(2)}</p>
            `;
                cartProducts.appendChild(produtoElement);
            });
        } else {
            const vazioElement = document.createElement('p');
            vazioElement.classList.add('text-center', 'text-gray-500');
            vazioElement.textContent = 'Seu carrinho está vazio.';
            cartProducts.appendChild(vazioElement);
        }
    }

    function atualizarContadorCarrinho() {
        const cartCountElement = document.getElementById('cart-count');
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        if (cartCountElement) {
            cartCountElement.textContent = totalItens;
        }
    }

    function salvarCarrinhoLocal() {
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
    }

    function atualizarCarrinho() {
        atualizarCarrinhoNoModal();
        atualizarContadorCarrinho();
    }

    function adicionarAoCarrinho(produtoId, quantidade) {
        const produtoExistente = carrinho.find(item => item.id === produtoId);
        if (produtoExistente) {
            produtoExistente.quantidade += quantidade;
        } else {
            const produtoNome = document.querySelector(`a[href="/produto/${produtoId}"]`).nextElementSibling.querySelector('h3').textContent;
            const produtoPreco = parseFloat(document.querySelector(`a[href="/produto/${produtoId}"]`).nextElementSibling.querySelector('p').textContent.replace('R$', '').trim());
            const produtoImagemElement = document.querySelector(`a[href="/produto/${produtoId}"] img`);
            const produtoImagem = produtoImagemElement ? produtoImagemElement.src : 'default-image.jpg';
            carrinho.push({ id: produtoId, nome: produtoNome, preco: produtoPreco, quantidade, imagem: produtoImagem });
        }

        atualizarCarrinho();
        salvarCarrinhoLocal();
        mostrarAlerta();
    }

    document.querySelectorAll('.btnComprar').forEach(botao => {
        botao.addEventListener('click', (e) => {
            const produtoId = e.target.getAttribute('data-id');
            const quantidade = parseInt(document.querySelector(`#quantidade-${produtoId}`).value, 10);
            adicionarAoCarrinho(produtoId, quantidade);
        });
    });

    // Sincronizar carrinho com servidor no carregamento
    async function sincronizarCarrinhoComServidor() {
        if (carrinho.length > 0) {
            try {
                const response = await fetch('/sincronizar-carrinho', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ carrinho }),
                });
    
                if (!response.ok) {
                    throw new Error('Erro ao sincronizar carrinho.');
                }
    
                console.log('Carrinho sincronizado com sucesso!');
            } catch (error) {
                console.error('Erro ao sincronizar o carrinho:', error);
            } finally {
                console.log('Sincronização do carrinho finalizada.');
            }
        }
    }
    
   

    sincronizarCarrinhoComServidor();
    atualizarCarrinho();
}); document.addEventListener('DOMContentLoaded', function () {
    const openCartModalButton = document.getElementById('open-cart-modal');
    const cartModal = document.getElementById('cart-modal');
    const closeCartModalButton = document.getElementById('close-cart-modal');
    const finalizarCompraButton = document.getElementById('finalizar-compra');

    function openCartModal() {
        cartModal.classList.remove('hidden');
    }

    function closeCartModal() {
        cartModal.classList.add('hidden');
    }

    // Fechar o modal antes de redirecionar para "finalizar-pedido"
    finalizarCompraButton?.addEventListener('click', function (e) {
        closeCartModal(); // Fecha o modal
        // O link será seguido após a execução do código
    });

    openCartModalButton?.addEventListener('click', openCartModal);
    closeCartModalButton?.addEventListener('click', closeCartModal);
});
document.getElementById('finalizar-compra').addEventListener('click', function () {
    // Redireciona para a página de pagamento
    window.location.href = '/pagamento'; // Substitua '/pagamento' pela URL da sua página de pagamento
});


document.addEventListener('DOMContentLoaded', () => {
    const cartModal = document.getElementById('cart-modal');
    const cartProducts = document.getElementById('cart-products');
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    function atualizarCarrinhoNoModal() {
        cartProducts.innerHTML = '';
        if (carrinho.length > 0) {
            carrinho.forEach(produto => {
                const produtoElement = document.createElement('div');
                produtoElement.classList.add('flex', 'items-center', 'justify-between', 'border-b', 'pb-4');
                produtoElement.innerHTML = `
                    <div class="flex items-center space-x-4">
                        <img src="${produto.imagem}" alt="${produto.nome}" class="w-16 h-16 object-cover rounded-md">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-700">${produto.nome}</h3>
                            <p class="text-sm text-gray-500">Quantidade: ${produto.quantidade}</p>
                            <p class="text-sm text-gray-500">Preço Unitário: R$ ${produto.preco.toFixed(2)}</p>
                        </div>
                    </div>
                    <p class="text-blue-600 font-bold">R$ ${(produto.preco * produto.quantidade).toFixed(2)}</p>
                `;
                cartProducts.appendChild(produtoElement);
            });
        } else {
            const vazioElement = document.createElement('p');
            vazioElement.classList.add('text-center', 'text-gray-500');
            vazioElement.textContent = 'Seu carrinho está vazio.';
            cartProducts.appendChild(vazioElement);
        }
    }

    document.getElementById('close-cart-modal')?.addEventListener('click', () => {
        cartModal.classList.add('hidden');
    });

    atualizarCarrinhoNoModal();
});