document.addEventListener('DOMContentLoaded', function () {
    // Função para abrir o modal de login
    function openLoginModal(e) {
        e.preventDefault();
        modal.classList.remove('hidden');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    }

    // Função para fechar o modal
    function closeModal() {
        modal.classList.add('hidden');
    }

    // Função para trocar entre o formulário de login e registro
    function toggleForms(showLoginForm) {
        if (showLoginForm) {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            loginTab.classList.add('border-blue-600');
            registerTab.classList.remove('border-blue-600');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            registerTab.classList.add('border-blue-600');
            loginTab.classList.remove('border-blue-600');
        }
    }

    // Modal de autenticação
    const openModal = document.getElementById('open-login-modal');
    const modal = document.getElementById('auth-modal');
    const closeModalButton = document.getElementById('close-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');

    if (openModal && modal && closeModalButton) {
        openModal.addEventListener('click', openLoginModal);
        closeModalButton.addEventListener('click', closeModal);
    }

    // Alternando entre os formulários de login e registro
    loginTab.addEventListener('click', () => toggleForms(true));
    registerTab.addEventListener('click', () => toggleForms(false));

    // Alternando a tab de login e registro
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginTab.click();
    });

    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerTab.click();
    });

    // Sidebar de categorias
    const categoriesButton = document.getElementById('categories-button');
    const filterSidebar = document.getElementById('filter-sidebar');
    const closeSidebar = document.getElementById('close-sidebar');

    // Mostrar a sidebar de categorias
    if (categoriesButton && filterSidebar && closeSidebar) {
        categoriesButton.addEventListener('click', function () {
            filterSidebar.classList.remove('hidden');
        });

        // Fechar a sidebar ao clicar no "X"
        closeSidebar.addEventListener('click', function () {
            filterSidebar.classList.add('hidden');
        });

        // Fechar a sidebar se clicar fora dela
        document.addEventListener('click', function (e) {
            if (!filterSidebar.contains(e.target) && !categoriesButton.contains(e.target)) {
                filterSidebar.classList.add('hidden');
            }
        });
    }

    // Filtro de preço
    const rangeInput = document.querySelector('input[type="range"]');
    const valueDisplay = document.querySelector('.value');
    if (rangeInput && valueDisplay) {
        rangeInput.addEventListener('input', function () {
            valueDisplay.textContent = rangeInput.value;
        });
    }

    // Modal de carrinho
    const openCartModal = document.getElementById('open-cart-modal');
    const closeCartModal = document.getElementById('close-cart-modal');
    const cartModal = document.getElementById('cart-modal');
    const checkoutButton = document.getElementById('checkout-button');

    // Abrir o modal do carrinho
    if (openCartModal) {
        openCartModal.addEventListener('click', function () {
            cartModal.classList.remove('hidden');
        });
    }

    // Fechar o modal do carrinho
    if (closeCartModal) {
        closeCartModal.addEventListener('click', function () {
            cartModal.classList.add('hidden');
        });
    }

    // Fechar o modal se clicar fora dele
    window.addEventListener('click', function (e) {
        if (e.target === cartModal) {
            cartModal.classList.add('hidden');
        }
    });

    // Adicionar preventDefault ao botão de finalização de compra
    if (checkoutButton) {
        checkoutButton.addEventListener('click', function (e) {
            e.preventDefault(); // Evitar o comportamento padrão de navegação
            window.location.href = '/checkout'; // Redireciona manualmente
        });
    }

    // Carrinho em memória (simulação)
    let carrinho = [];

    // Selecionar todos os botões de "Comprar"
    const botoesComprar = document.querySelectorAll('.btnComprar');
    const cartCountElement = document.getElementById('cart-count');

    // Função para mostrar um alerta estilizado
    function mostrarAlerta() {
        const alerta = document.createElement('div');
        alerta.classList.add('fixed', 'top-4', 'right-4', 'bg-green-500', 'text-white', 'p-4', 'rounded', 'shadow-lg', 'z-50');
        alerta.textContent = 'Produto adicionado ao carrinho!';

        document.body.appendChild(alerta);

        setTimeout(() => {
            alerta.remove();
        }, 2000);
    }

    // Função para adicionar ao carrinho
    function adicionarAoCarrinho(produtoId, quantidade) {
        const produtoExistente = carrinho.find(item => item.id === produtoId);

        if (produtoExistente) {
            // Atualizar quantidade se o produto já estiver no carrinho
            produtoExistente.quantidade += quantidade;
        } else {
            // Simulação de obter os detalhes do produto
            const produtoNome = document.querySelector(`a[href="/produto/${produtoId}"]`).nextElementSibling.querySelector('h3').textContent;
            const produtoPreco = parseFloat(document.querySelector(`a[href="/produto/${produtoId}"]`).nextElementSibling.querySelector('p').textContent.replace('R$', '').trim());
            const produtoImagemElement = document.querySelector(`a[href="/produto/${produtoId}"] img`);
            const produtoImagem = produtoImagemElement ? produtoImagemElement.src : 'default-image.jpg'; // Imagem padrão se não encontrar

            carrinho.push({
                id: produtoId,
                nome: produtoNome,
                preco: produtoPreco,
                quantidade: quantidade,
                imagem: produtoImagem
            });
        }
        atualizarCarrinho();
        atualizarContadorCarrinho();
        mostrarAlerta(); // Exibir alerta estilizado
    }

    // Função para atualizar o modal do carrinho
    function atualizarCarrinho() {
        const cartModalContent = document.getElementById('cart-modal-content');

        if (!cartModalContent) {
            console.error("Elemento 'cart-modal-content' não encontrado.");
            return;
        }

        if (carrinho.length > 0) {
            cartModalContent.innerHTML = carrinho.map(item => `
                <li class="flex items-center justify-between border-b py-2">
                    <img src="${item.imagem}" alt="${item.nome}" class="w-16 h-16 object-cover rounded mr-4">
                    <span>${item.nome} (x${item.quantidade})</span>
                    <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                </li>
            `).join('');
        } else {
            cartModalContent.innerHTML = '<p class="text-center text-gray-500">Seu carrinho está vazio.</p>';
        }

        // Atualizar o valor total
        const total = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
        const totalValorElement = document.getElementById('total-valor');
        if (totalValorElement) {
            totalValorElement.textContent = total.toFixed(2);
        } else {
            console.error("Elemento 'total-valor' não encontrado.");
        }
    }

    // Função para atualizar o contador de itens no carrinho
    function atualizarContadorCarrinho() {
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        if (cartCountElement) {
            cartCountElement.textContent = totalItens;
        } else {
            console.error("Elemento 'cart-count' não encontrado.");
        }
    }

    // Evento para os botões de "Comprar"
    botoesComprar.forEach(botao => {
        botao.addEventListener('click', (e) => {
            const produtoId = e.target.getAttribute('data-id');
            const quantidade = parseInt(document.querySelector(`#quantidade-${produtoId}`).value, 10);

            adicionarAoCarrinho(produtoId, quantidade);
        });
    });

    // Evento para abrir o modal do carrinho
    const abrirModalCarrinho = document.getElementById('abrir-cart-modal');
    if (abrirModalCarrinho && cartModal) {
        abrirModalCarrinho.addEventListener('click', () => {
            atualizarCarrinho(); // Atualizar carrinho ao abrir modal
            cartModal.classList.remove('hidden');
        });
    }
});