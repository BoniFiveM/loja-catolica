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
        console.log('Login modal aberto.');
    }

    function closeModal() {
        modal.classList.add('hidden');
        console.log('Login modal fechado.');
    }

    function toggleForms(showLoginForm) {
        loginForm.classList.toggle('hidden', !showLoginForm);
        registerForm.classList.toggle('hidden', showLoginForm);
        loginTab.classList.toggle('border-blue-600', showLoginForm);
        registerTab.classList.toggle('border-blue-600', !showLoginForm);
        console.log('Formulário alternado para:', showLoginForm ? 'Login' : 'Registro');
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
        console.log('Alerta exibido: Produto adicionado ao carrinho.');
    }

    function atualizarCarrinho() {
        const cartModalContent = document.getElementById('cart-modal-content');
        const total = carrinho.reduce((total, item) => total + item.preco * item.quantidade, 0);
        const totalValorElement = document.getElementById('total-valor');

        if (cartModalContent) {
            cartModalContent.innerHTML = carrinho.length
                ? carrinho.map(item => `
                    <li class="flex items-center justify-between border-b py-2">
                        <img src="${item.imagem}" alt="${item.nome}" class="w-16 h-16 object-cover rounded mr-4">
                        <span>${item.nome} (x${item.quantidade})</span>
                        <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                    </li>
                `).join('')
                : '<p class="text-center text-gray-500">Seu carrinho está vazio.</p>';
        }

        if (totalValorElement) {
            totalValorElement.textContent = total.toFixed(2);
        }

        console.log('Carrinho atualizado:', carrinho);
    }

    function atualizarContadorCarrinho() {
        const cartCountElement = document.getElementById('cart-count');
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        if (cartCountElement) {
            cartCountElement.textContent = totalItens;
        }
        console.log('Contador do carrinho atualizado:', totalItens);
    }

    function salvarCarrinhoLocal() {
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        console.log('Carrinho salvo no localStorage:', carrinho);
    }

    function adicionarAoCarrinho(produtoId, quantidade) {
        console.log('Adicionando produto ao carrinho:', { produtoId, quantidade });

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
        atualizarContadorCarrinho();
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

    // Agora, abre o modal do carrinho ao clicar no contador
    const cartCountElement = document.getElementById('cart-count');
    cartCountElement?.addEventListener('click', () => {
        atualizarCarrinho();
        cartModal.classList.remove('hidden');
        console.log('Modal do carrinho aberto.');
    });

    closeCartModal?.addEventListener('click', () => {
        cartModal.classList.add('hidden');
        console.log('Modal do carrinho fechado.');
    });

    checkoutButton?.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Redirecionando para a página de checkout.');
        window.location.href = '/checkoutbuy';
    });

    salvarCarrinhoLocal();
    atualizarCarrinho();
    atualizarContadorCarrinho();

    // Logout limpa o carrinho
    const logoutForm = document.querySelector('form[action="/logout"]');
    if (logoutForm) {
        logoutForm.addEventListener('submit', function () {
            console.log('Logout acionado, limpando carrinho.');
            localStorage.removeItem('carrinho');
            carrinho = [];
            atualizarCarrinho();
            atualizarContadorCarrinho();
        });
    }
});
