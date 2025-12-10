/**
 * Planejador Financeiro Pessoal
 * 
 * Este arquivo contém toda a lógica JavaScript da aplicação.
 * O código está extensivamente comentado para fins didáticos,
 * explicando cada função e conceito para iniciantes em JavaScript.
 */

// ========== CONFIGURAÇÃO INICIAL ==========

/**
 * Estado global da aplicação
 * Armazena todos os dados que precisamos gerenciar
 */
const appState = {
    theme: 'light',
    currentUser: null,
    accounts: [],
    transactions: [],
    currentExchangeRate: null,
    editingAccountId: null,
    activeMonthFilter: null,
    activeAccountFilter: 'all',
};

// Textos fixos em pt-BR
const TEXT = {
    noAccounts: 'Nenhuma conta encontrada. Adicione uma conta para começar.',
    noTransactions: 'Nenhuma transação encontrada.',
    confirmDeleteAccount: 'Tem certeza que deseja excluir esta conta?',
    confirmDeleteTransactions: 'Excluir também as transações associadas?',
    accountNameRequired: 'Nome da conta é obrigatório.',
    descriptionRequired: 'Descrição é obrigatória.',
    amountPositive: 'O valor deve ser positivo.',
    accountRequired: 'Selecione uma conta.',
    dateRequired: 'Selecione uma data.',
    destinationAccountRequired: 'Selecione a conta destino.',
    differentAccountsRequired: 'As contas devem ser diferentes.',
    initialDeposit: 'Depósito inicial',
    balanceAdjustment: 'Ajuste de saldo',
    loading: 'Carregando...',
    insightError: 'Erro ao carregar dica financeira.',
    exchangeError: 'Erro ao carregar taxa de câmbio.'
};

// Labels de categorias (chaves em pt)
const CATEGORY_LABEL_PT = {
    moradia: 'Moradia',
    alimentacao: 'Alimentação',
    transporte: 'Transporte',
    lazer: 'Lazer',
    saude: 'Saúde',
    educacao: 'Educação',
    outros: 'Outros'
};

/**
 * Elementos DOM frequentemente utilizados
 * Armazenamos referências aos elementos para evitar buscá-los repetidamente
 */
const elements = {
    // Header e tema
    appTitle: document.getElementById('app-title'),
    themeToggle: document.getElementById('theme-toggle'),
    
    // Elementos de resumo
    totalBalanceLabel: document.getElementById('total-balance-label'),
    totalBalanceValue: document.getElementById('total-balance-value'),
    totalIncomeValue: document.getElementById('total-income-value'),
    totalExpenseValue: document.getElementById('total-expense-value'),
    insightLabel: document.getElementById('insight-label'),
    insightContent: document.getElementById('insight-content'),
    refreshInsight: document.getElementById('refresh-insight'),
    exchangeLabel: document.getElementById('exchange-label'),
    exchangeContent: document.getElementById('exchange-content'),
    refreshExchange: document.getElementById('refresh-exchange'),
    
    // Elementos de contas
    accountsLabel: document.getElementById('accounts-label'),
    addAccountText: document.getElementById('add-account-text'),
    addAccountBtn: document.getElementById('add-account-btn'),
    accountsList: document.getElementById('accounts-list'),
    
    // Elementos de transações
    transactionsLabel: document.getElementById('transactions-label'),
    addIncomeText: document.getElementById('add-income-text'),
    addExpenseText: document.getElementById('add-expense-text'),
    addTransferText: document.getElementById('add-transfer-text'),
    addIncomeBtn: document.getElementById('add-income-btn'),
    addExpenseBtn: document.getElementById('add-expense-btn'),
    addTransferBtn: document.getElementById('add-transfer-btn'),
    transactionsList: document.getElementById('transactions-list'),
    
    // Elementos de análise
    expensesAnalysisLabel: document.getElementById('expenses-analysis-label'),
    expensesChart: document.getElementById('expenses-chart'),
    
    // Elementos do modal de conta
    accountModal: document.getElementById('account-modal'),
    accountModalTitle: document.getElementById('account-modal-title'),
    accountForm: document.getElementById('account-form'),
    accountNameLabel: document.getElementById('account-name-label'),
    accountBalanceLabel: document.getElementById('account-balance-label'),
    accountName: document.getElementById('account-name'),
    accountBalance: document.getElementById('account-balance'),
    cancelAccountBtn: document.getElementById('cancel-account-btn'),
    saveAccountBtn: document.getElementById('save-account-btn'),
    
    // Elementos do modal de transação
    transactionModal: document.getElementById('transaction-modal'),
    transactionModalTitle: document.getElementById('transaction-modal-title'),
    transactionForm: document.getElementById('transaction-form'),
    transactionType: document.getElementById('transaction-type'),
    transactionDescriptionLabel: document.getElementById('transaction-description-label'),
    transactionAmountLabel: document.getElementById('transaction-amount-label'),
    transactionCategoryLabel: document.getElementById('transaction-category-label'),
    transactionAccountLabel: document.getElementById('transaction-account-label'),
    transactionToAccountLabel: document.getElementById('transaction-to-account-label'),
    transactionDateLabel: document.getElementById('transaction-date-label'),
    transactionDescription: document.getElementById('transaction-description'),
    transactionAmount: document.getElementById('transaction-amount'),
    transactionCategory: document.getElementById('transaction-category'),
    transactionCategoryGroup: document.getElementById('transaction-category-group'),
    transactionAccount: document.getElementById('transaction-account'),
    transactionToAccount: document.getElementById('transaction-to-account'),
    transactionToAccountGroup: document.getElementById('transaction-to-account-group'),
    transactionDate: document.getElementById('transaction-date'),
    cancelTransactionBtn: document.getElementById('cancel-transaction-btn'),
    saveTransactionBtn: document.getElementById('save-transaction-btn'),

    // Elementos da sidebar (filtros)
    filterMonthCurrent: document.getElementById('filter-month-current'),
    filterMonthPrev: document.getElementById('filter-month-prev'),
    sidebarAccountFilter: document.getElementById('sidebar-account-filter'),
    headerEl: document.querySelector('header'),
    settingsBtn: document.getElementById('settings-btn'),
    logoutBtn: document.getElementById('logout-btn'),

    // Autenticação
    authScreen: document.getElementById('auth-screen'),
    appScreen: document.getElementById('app-screen'),
    authForm: document.getElementById('auth-form'),
    authUsername: document.getElementById('auth-username'),
    authPassword: document.getElementById('auth-password'),
    authLoginBtn: document.getElementById('auth-login-btn'),
    authRegisterBtn: document.getElementById('auth-register-btn'),
    authToggleLink: document.getElementById('auth-toggle-link'),
    toastContainer: document.getElementById('toast-container'),
    settingsModal: document.getElementById('settings-modal'),
    newPassword: document.getElementById('new-password'),
    changePasswordBtn: document.getElementById('change-password-btn'),
    backupBtn: document.getElementById('backup-btn'),
    restoreInput: document.getElementById('restore-input'),
    filterStart: document.getElementById('filter-start'),
    filterEnd: document.getElementById('filter-end'),
    applyDateFilter: document.getElementById('apply-date-filter'),
};

// ========== INICIALIZAÇÃO DA APLICAÇÃO ==========

/**
 * Função que inicializa a aplicação quando a página é carregada
 * Esta é a função principal que chama todas as outras funções de inicialização
 */
function initApp() {
    // Carrega as configurações salvas (idioma e tema)
    loadSettings();
    
    // Carrega os dados do usuário (contas e transações)
    loadUserData();
    
    // Configura os event listeners para os botões e formulários
    setupEventListeners();
    
    // Atualiza a interface com os dados carregados
    updateUI();
    
    // Carrega uma dica financeira aleatória
    loadRandomInsight();
    
    // Carrega a taxa de câmbio atual
    loadExchangeRate();
    
    // Define a data atual no campo de data do formulário de transação
    setCurrentDateInTransactionForm();

    setupHideOnScrollHeader();
}

function setupHideOnScrollHeader() {
    let lastScrollTop = 0;
    let ticking = false;
    window.addEventListener('scroll', () => {
        const current = window.pageYOffset || document.documentElement.scrollTop;
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (current > lastScrollTop && current > 50) {
                    elements.headerEl.classList.add('header-hidden');
                } else {
                    elements.headerEl.classList.remove('header-hidden');
                }
                lastScrollTop = current <= 0 ? 0 : current;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

/**
 * Carrega as configurações salvas do localStorage
 * Configurações incluem idioma e tema preferido
 */
function loadSettings() {
    // Tema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        appState.theme = savedTheme;
    }
    
    // Aplica o tema salvo ao elemento body
    document.body.setAttribute('data-theme', appState.theme);
    
    // Atualiza o ícone do botão de tema
    updateThemeToggleIcon();
}

/**
 * Carrega os dados do usuário do localStorage
 * Dados incluem contas e transações
 */
function loadUserData() {
    const users = getUsersDb();
    const idx = users.findIndex(u => u.username === appState.currentUser);
    if (idx !== -1) {
        const data = users[idx].data || { accounts: [], transactions: [] };
        appState.accounts = data.accounts || [];
        appState.transactions = data.transactions || [];
    } else {
        appState.accounts = [];
        appState.transactions = [];
    }
}

/**
 * Configura todos os event listeners da aplicação
 * Event listeners são funções que respondem a eventos como cliques
 */
function setupEventListeners() {
    // Tema
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Event listeners para atualizar dica financeira e taxa de câmbio
    elements.refreshInsight.addEventListener('click', loadRandomInsight);
    elements.refreshExchange.addEventListener('click', loadExchangeRate);
    
    // Event listeners para adicionar conta e transações
    elements.addAccountBtn.addEventListener('click', () => openAccountModal());
    elements.addIncomeBtn.addEventListener('click', () => openTransactionModal('income'));
    elements.addExpenseBtn.addEventListener('click', () => openTransactionModal('expense'));
    elements.addTransferBtn.addEventListener('click', () => openTransactionModal('transfer'));
    
    // Event listeners para os formulários
    elements.accountForm.addEventListener('submit', handleAccountFormSubmit);
    elements.transactionForm.addEventListener('submit', handleTransactionFormSubmit);
    
    // Event listeners para fechar modais
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Event listeners para os botões de cancelar nos modais
    elements.cancelAccountBtn.addEventListener('click', closeAllModals);
    elements.cancelTransactionBtn.addEventListener('click', closeAllModals);

    // Event listeners dos filtros da sidebar
    elements.filterMonthCurrent.addEventListener('click', () => {
        /**
         * Quando o usuário clica em "Mês Atual":
         * - Atualizamos o estado para refletir o filtro de mês corrente
         * - Re-renderizamos a lista de transações já filtrada
         * - Atualizamos os cards de resumo para refletirem os dados filtrados
         */
        appState.activeMonthFilter = 'current';
        // Feedback visual simples: destacamos o botão ativo
        elements.filterMonthCurrent.classList.add('active');
        elements.filterMonthPrev.classList.remove('active');
        renderTransactions();
        updateSummaryCards();
    });

    elements.filterMonthPrev.addEventListener('click', () => {
        /**
         * Quando o usuário clica em "Mês Anterior":
         * - Ajustamos o estado para filtrar pelo mês passado
         * - Atualizamos transações e resumo de acordo com o filtro
         */
        appState.activeMonthFilter = 'prev';
        elements.filterMonthPrev.classList.add('active');
        elements.filterMonthCurrent.classList.remove('active');
        renderTransactions();
        updateSummaryCards();
    });

    elements.sidebarAccountFilter.addEventListener('change', (event) => {
        /**
         * Ao trocar a conta no select:
         * - Guardamos o ID selecionado (ou 'all') no estado
         * - Recriamos a UI das transações e dos resumos com base nesse recorte
         */
        appState.activeAccountFilter = event.target.value;
        renderTransactions();
        updateSummaryCards();
    });
    if (elements.applyDateFilter) {
        elements.applyDateFilter.addEventListener('click', () => {
            appState.activeMonthFilter = null;
            if (elements.filterMonthCurrent) elements.filterMonthCurrent.classList.remove('active');
            if (elements.filterMonthPrev) elements.filterMonthPrev.classList.remove('active');
            appState.dateFilterStart = elements.filterStart && elements.filterStart.value ? elements.filterStart.value : null;
            appState.dateFilterEnd = elements.filterEnd && elements.filterEnd.value ? elements.filterEnd.value : null;
            renderTransactions();
            updateSummaryCards();
        });
    }
    // Autenticação
    if (elements.authLoginBtn) {
        elements.authLoginBtn.addEventListener('click', () => {
            const username = elements.authUsername.value.trim();
            const password = elements.authPassword.value;
            loginUser(username, password);
        });
    }
    if (elements.authRegisterBtn) {
        elements.authRegisterBtn.addEventListener('click', () => {
            const username = elements.authUsername.value.trim();
            const password = elements.authPassword.value;
            registerUser(username, password);
        });
    }
    if (elements.authToggleLink) {
        elements.authToggleLink.addEventListener('click', toggleAuthMode);
    }
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', () => {
            appState.currentUser = null;
            localStorage.removeItem(STORAGE.CURRENT_USER);
            location.reload();
        });
    }
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', () => {
            if (elements.settingsModal) elements.settingsModal.classList.add('active');
        });
    }
    if (elements.changePasswordBtn) {
        elements.changePasswordBtn.addEventListener('click', () => {
            const pw = elements.newPassword ? elements.newPassword.value.trim() : '';
            if (!pw) { showToast('Informe a nova senha.', 'warning'); return; }
            const users = getUsersDb();
            const idx = users.findIndex(u => u.username === appState.currentUser);
            if (idx !== -1) {
                users[idx].password = pw;
                setUsersDb(users);
                showToast('Senha alterada com sucesso.', 'success');
                if (elements.settingsModal) elements.settingsModal.classList.remove('active');
                if (elements.newPassword) elements.newPassword.value = '';
            } else {
                showToast('Usuário não encontrado.', 'error');
            }
        });
    }
    if (elements.backupBtn) {
        elements.backupBtn.addEventListener('click', () => {
            const data = localStorage.getItem(STORAGE.USERS_DB) || '[]';
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Backup gerado.', 'success');
        });
    }
    if (elements.restoreInput) {
        elements.restoreInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const parsed = JSON.parse(text);
                if (!Array.isArray(parsed)) { showToast('Arquivo inválido.', 'error'); return; }
                setUsersDb(parsed);
                showToast('Backup restaurado.', 'success');
                location.reload();
            } catch {
                showToast('Falha ao restaurar backup.', 'error');
            }
        });
    }
}

/**
 * Define a data atual no campo de data do formulário de transação
 */
function setCurrentDateInTransactionForm() {
    // Obtém a data atual no formato YYYY-MM-DD
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    // Define a data atual no campo de data
    elements.transactionDate.value = formattedDate;
}

// ========== FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE ==========

/**
 * Atualiza toda a interface com base no estado atual da aplicação
 * Esta função é chamada sempre que há uma mudança nos dados
 */
function updateUI() {
    // Textos fixos em pt-BR (sem i18n)
    // Renderiza as contas
    renderAccounts();
    
    // Renderiza as transações respeitando filtros
    renderTransactions();
    
    // Preenche o select de contas da sidebar (mantém posição atual)
    populateSidebarAccountFilter();

    // Atualiza cartões de resumo (Saldo, Receitas, Gastos) respeitando filtros
    updateSummaryCards();
    
    // Renderiza o gráfico de despesas
    renderExpensesChart();
}

/**
 * Atualiza todos os textos da interface com base no idioma selecionado
 */
function updateTexts() {
    document.title = 'Planejador Financeiro';
    elements.appTitle.textContent = 'Planejador Financeiro';
    elements.totalBalanceLabel.textContent = 'Saldo Total';
    elements.insightLabel.textContent = 'Dica Financeira';
    elements.exchangeLabel.textContent = 'Taxa de Câmbio';
    elements.accountsLabel.textContent = 'Minhas Contas';
    elements.addAccountText.textContent = 'Adicionar Conta';
    elements.transactionsLabel.textContent = 'Transações';
    elements.addIncomeText.textContent = 'Receita';
    elements.addExpenseText.textContent = 'Despesa';
    elements.addTransferText.textContent = 'Transferência';
    elements.expensesAnalysisLabel.textContent = 'Análise de Gastos';
    elements.accountNameLabel.textContent = 'Nome da Conta';
    elements.accountBalanceLabel.textContent = 'Saldo Inicial';
    elements.cancelAccountBtn.textContent = 'Cancelar';
    elements.saveAccountBtn.textContent = 'Salvar';
    elements.transactionDescriptionLabel.textContent = 'Descrição';
    elements.transactionAmountLabel.textContent = 'Valor';
    elements.transactionCategoryLabel.textContent = 'Categoria';
    elements.transactionAccountLabel.textContent = 'Conta';
    elements.transactionToAccountLabel.textContent = 'Conta Destino';
    elements.transactionDateLabel.textContent = 'Data';
    elements.cancelTransactionBtn.textContent = 'Cancelar';
    elements.saveTransactionBtn.textContent = 'Salvar';
    updateCategoryOptions();
}

/**
 * Atualiza as opções de categoria no select de categorias
 */
function updateCategoryOptions() {
    // Limpa as opções existentes
    elements.transactionCategory.innerHTML = '';
    const categories = [
        { value: 'moradia', text: 'Moradia' },
        { value: 'alimentacao', text: 'Alimentação' },
        { value: 'transporte', text: 'Transporte' },
        { value: 'lazer', text: 'Lazer' },
        { value: 'saude', text: 'Saúde' },
        { value: 'educacao', text: 'Educação' },
        { value: 'outros', text: 'Outros' }
    ];
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.value;
        option.textContent = category.text;
        elements.transactionCategory.appendChild(option);
    });
}

/**
 * Renderiza as contas na interface
 */
function renderAccounts() {
    // Limpa a lista de contas
    elements.accountsList.innerHTML = '';
    
    // Se não houver contas, exibe uma mensagem
    if (appState.accounts.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = TEXT.noAccounts;
        elements.accountsList.appendChild(emptyMessage);
        return;
    }
    
    // Renderiza cada conta
    appState.accounts.forEach(account => {
        const accountCard = createAccountCard(account);
        elements.accountsList.appendChild(accountCard);
    });
}

/**
 * Cria um elemento de cartão para uma conta
 * @param {Object} account - A conta a ser renderizada
 * @returns {HTMLElement} - O elemento de cartão criado
 */
function createAccountCard(account) {
    // Cria o elemento de cartão
    const card = document.createElement('div');
    card.className = 'card account-card';
    card.dataset.id = account.id;
    
    // Cria o cabeçalho do cartão
    const header = document.createElement('div');
    header.className = 'card-header';
    
    // Cria o título do cartão
    const title = document.createElement('h3');
    title.textContent = account.name;
    header.appendChild(title);
    
    // Cria os botões de ação
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    
    // Botão de editar
    const editBtn = document.createElement('button');
    editBtn.className = 'icon-button';
    editBtn.innerHTML = '<span class="material-symbols-outlined">edit</span>';
    editBtn.addEventListener('click', () => openAccountModal(account.id));
    actions.appendChild(editBtn);
    
    // Botão de excluir
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-button';
    deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
    deleteBtn.addEventListener('click', () => {
        if (confirm(TEXT.confirmDeleteAccount)) {
            deleteAccount(account.id);
        }
    });
    actions.appendChild(deleteBtn);
    
    header.appendChild(actions);
    card.appendChild(header);
    
    // Cria o conteúdo do cartão
    const content = document.createElement('div');
    content.className = 'card-content';
    
    // Cria o saldo
    const balance = document.createElement('p');
    balance.className = 'account-balance';
    balance.textContent = formatCurrency(account.balance);
    content.appendChild(balance);
    
    card.appendChild(content);
    
    return card;
}

/**
 * Renderiza as transações na interface
 */
function renderTransactions() {
    // Limpa a lista de transações
    elements.transactionsList.innerHTML = '';

    // Calcula a coleção já filtrada (conta e mês)
    const filtered = getFilteredTransactions();

    // Se não houver transações após os filtros, exibe uma mensagem
    if (filtered.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = TEXT.noTransactions;
        elements.transactionsList.appendChild(emptyMessage);
        return;
    }
    
    // Ordena as transações por data (mais recentes primeiro)
    const sortedTransactions = [...filtered].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    // Renderiza cada transação
    sortedTransactions.forEach(transaction => {
        const transactionItem = createTransactionItem(transaction);
        elements.transactionsList.appendChild(transactionItem);
    });
}

/**
 * Cria um elemento de item para uma transação
 * @param {Object} transaction - A transação a ser renderizada
 * @returns {HTMLElement} - O elemento de item criado
 */
function createTransactionItem(transaction) {
    // Cria o elemento de item
    const item = document.createElement('div');
    item.className = `transaction-item ${transaction.type}`;
    item.dataset.id = transaction.id;
    
    // Cria o conteúdo do item
    const content = document.createElement('div');
    content.className = 'transaction-content';
    
    // Cria a descrição
    const description = document.createElement('p');
    description.className = 'transaction-description';
    description.textContent = transaction.description;
    content.appendChild(description);
    
    // Cria os detalhes
    const details = document.createElement('div');
    details.className = 'transaction-details';
    
    // Adiciona a data
    const date = document.createElement('span');
    date.className = 'transaction-date';
    date.textContent = new Date(transaction.date).toLocaleDateString();
    details.appendChild(date);
    
    // Adiciona a categoria (apenas para despesas)
    if (transaction.type === 'expense' && transaction.category) {
        const category = document.createElement('span');
        category.className = 'transaction-category';
        category.textContent = CATEGORY_LABEL_PT[transaction.category] || transaction.category;
        details.appendChild(category);
    }
    
    // Adiciona a conta
    const account = appState.accounts.find(acc => acc.id === transaction.accountId);
    if (account) {
        const accountElement = document.createElement('span');
        accountElement.className = 'transaction-account';
        accountElement.textContent = account.name;
        details.appendChild(accountElement);
        
        // Adiciona a conta de destino (apenas para transferências)
        if (transaction.type === 'transfer' && transaction.toAccountId) {
            const toAccount = appState.accounts.find(acc => acc.id === transaction.toAccountId);
            if (toAccount) {
                const arrow = document.createElement('span');
                arrow.className = 'transaction-arrow';
                arrow.textContent = '→';
                details.appendChild(arrow);
                
                const toAccountElement = document.createElement('span');
                toAccountElement.className = 'transaction-to-account';
                toAccountElement.textContent = toAccount.name;
                details.appendChild(toAccountElement);
            }
        }
    }
    
    content.appendChild(details);
    item.appendChild(content);
    
    // Cria o valor
    const amount = document.createElement('p');
    amount.className = 'transaction-amount';
    
    // Formata o valor com base no tipo de transação
    if (transaction.type === 'income') {
        amount.textContent = `+${formatCurrency(transaction.amount)}`;
    } else if (transaction.type === 'expense') {
        amount.textContent = `-${formatCurrency(transaction.amount)}`;
    } else if (transaction.type === 'transfer') {
        amount.textContent = formatCurrency(transaction.amount);
    }
    
    item.appendChild(amount);
    
    return item;
}

/**
 * Atualiza o saldo total na interface
 */
function updateTotalBalance() {
    /**
     * O saldo total deve refletir o filtro de conta ativo.
     * Se uma conta específica estiver selecionada, somamos apenas o saldo dessa conta.
     * Caso contrário, somamos o saldo de todas as contas.
     * Observação: filtros por mês não alteram saldos das contas, pois
     * saldo é um estado acumulado atual e não um valor periódico.
     */
    const accountsToSum = (appState.activeAccountFilter && appState.activeAccountFilter !== 'all')
        ? appState.accounts.filter(acc => acc.id === appState.activeAccountFilter)
        : appState.accounts;

    const totalBalance = accountsToSum.reduce((total, account) => total + account.balance, 0);
    elements.totalBalanceValue.textContent = formatCurrency(totalBalance);
}

/**
 * Retorna a lista de transações respeitando filtros de conta e mês
 * Explicação didática: em vez de espalhar lógica de filtro em vários lugares,
 * centralizamos em uma função pura que recebe o estado global e devolve
 * exatamente o recorte que precisamos renderizar.
 */
function getFilteredTransactions() {
    // Começamos com todas as transações
    let result = [...appState.transactions];

    // 1) Filtro por conta:
    // Se uma conta específica estiver selecionada, mantemos transações que
    // tenham relação com ela. Para receitas/despesas, é a `accountId`.
    // Para transferências, consideramos tanto `accountId` (origem) quanto `toAccountId` (destino).
    if (appState.activeAccountFilter && appState.activeAccountFilter !== 'all') {
        const sel = appState.activeAccountFilter;
        result = result.filter(t => (
            t.accountId === sel || t.toAccountId === sel
        ));
    }

    // 2) Filtro por mês:
    // Se um filtro de mês estiver ativo, calculamos mês/ano alvo e mantemos
    // apenas transações cuja data pertença a esse mês/ano.
    if (appState.activeMonthFilter) {
        const now = new Date();
        let targetMonth = now.getMonth();
        let targetYear = now.getFullYear();

        if (appState.activeMonthFilter === 'prev') {
            // Se for janeiro (mês 0), mês anterior cai dezembro do ano anterior
            if (targetMonth === 0) {
                targetMonth = 11;
                targetYear -= 1;
            } else {
                targetMonth -= 1;
            }
        }

        result = result.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
        });
    }

    if (appState.dateFilterStart || appState.dateFilterEnd) {
        const start = appState.dateFilterStart ? new Date(appState.dateFilterStart) : null;
        const end = appState.dateFilterEnd ? new Date(appState.dateFilterEnd) : null;
        result = result.filter(t => {
            const d = new Date(t.date);
            if (start && d < start) return false;
            if (end) {
                const endDay = new Date(end);
                endDay.setHours(23, 59, 59, 999);
                if (d > endDay) return false;
            }
            return true;
        });
    }

    return result;
}

/**
 * Atualiza os cartões de resumo (Saldo, Receitas, Gastos)
 * Esta função é responsável por recalcular os números conforme os filtros ativos.
 */
function updateSummaryCards() {
    // 1) Atualiza saldo total considerando filtro de conta
    updateTotalBalance();

    // 2) Calcula totais de receitas e despesas da coleção filtrada
    const filtered = getFilteredTransactions();

    const totalIncome = filtered
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filtered
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    elements.totalIncomeValue.textContent = formatCurrency(totalIncome);
    elements.totalExpenseValue.textContent = formatCurrency(totalExpense);
}

/**
 * Preenche o select de contas da sidebar
 * Inclui uma opção "Todas as Contas" no topo para limpar o filtro.
 */
function populateSidebarAccountFilter() {
    // Limpamos qualquer opção anterior para evitar duplicações
    elements.sidebarAccountFilter.innerHTML = '';

    // Opção agregadora "Todas as Contas" traduzida conforme o idioma atual
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Todas as Contas';
    elements.sidebarAccountFilter.appendChild(allOption);

    // Para cada conta cadastrada, criamos uma opção
    appState.accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = account.name;
        elements.sidebarAccountFilter.appendChild(option);
    });

    // Mantém o valor selecionado consistente com o estado atual
    elements.sidebarAccountFilter.value = appState.activeAccountFilter;
}

/**
 * Renderiza o gráfico de despesas por categoria
 */
function renderExpensesChart() {
    // Obtém as despesas
    const expenses = appState.transactions.filter(transaction => transaction.type === 'expense');
    
    // Se não houver despesas, limpa o gráfico
    if (expenses.length === 0) {
        if (window.expensesChart) {
            window.expensesChart.destroy();
            window.expensesChart = null;
        }
        return;
    }
    
    // Agrupa as despesas por categoria
    const expensesByCategory = {};
    expenses.forEach(expense => {
        if (!expensesByCategory[expense.category]) {
            expensesByCategory[expense.category] = 0;
        }
        expensesByCategory[expense.category] += expense.amount;
    });
    
    // Prepara os dados para o gráfico
    const categories = Object.keys(expensesByCategory);
    const values = Object.values(expensesByCategory);
    const labels = categories.map(category => CATEGORY_LABEL_PT[category] || category);
    
    // Define as cores para cada categoria
    const colors = [
        '#FF6384', // Vermelho
        '#36A2EB', // Azul
        '#FFCE56', // Amarelo
        '#4BC0C0', // Verde água
        '#9966FF', // Roxo
        '#FF9F40', // Laranja
        '#C9CBCF'  // Cinza
    ];
    
    // Cria ou atualiza o gráfico
    if (window.expensesChart) {
        window.expensesChart.data.labels = labels;
        window.expensesChart.data.datasets[0].data = values;
        window.expensesChart.update();
    } else {
        const ctx = elements.expensesChart.getContext('2d');
        window.expensesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, categories.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// ========== FUNÇÕES DE MANIPULAÇÃO DE DADOS ==========

/**
 * Salva uma conta nova ou atualiza uma existente
 * @param {Object} accountData - Os dados da conta a ser salva
 */
function saveAccount(accountData) {
    // Se estiver editando uma conta existente
    if (appState.editingAccountId) {
        // Encontra o índice da conta no array
        const accountIndex = appState.accounts.findIndex(account => account.id === appState.editingAccountId);
        
        // Se a conta for encontrada, atualiza seus dados
        if (accountIndex !== -1) {
            // Calcula a diferença entre o novo saldo e o saldo anterior
            const balanceDifference = accountData.balance - appState.accounts[accountIndex].balance;
            
            // Atualiza os dados da conta
            appState.accounts[accountIndex].name = accountData.name;
            appState.accounts[accountIndex].balance = accountData.balance;
            
            // Se o saldo foi alterado, cria uma transação de ajuste
            if (balanceDifference !== 0) {
                const transactionType = balanceDifference > 0 ? 'income' : 'expense';
                const transactionAmount = Math.abs(balanceDifference);
                
                // Cria a transação de ajuste
                const adjustmentTransaction = {
                    id: generateId(),
                    type: transactionType,
                    description: TEXT.balanceAdjustment,
                    amount: transactionAmount,
                    accountId: appState.editingAccountId,
                    date: new Date().toISOString().split('T')[0],
                    category: 'outros'
                };
                
                // Adiciona a transação ao array
                appState.transactions.push(adjustmentTransaction);
                
                // Salva as transações no localStorage
                saveTransactions();
            }
        }
        
        // Limpa o ID da conta sendo editada
        appState.editingAccountId = null;
    } else {
        // Cria uma nova conta com os dados fornecidos
        const newAccount = {
            id: generateId(),
            name: accountData.name,
            balance: accountData.balance
        };
        
        // Adiciona a conta ao array
        appState.accounts.push(newAccount);
        
        // Se o saldo inicial for maior que zero, cria uma transação de depósito inicial
        if (newAccount.balance > 0) {
            const initialDepositTransaction = {
                id: generateId(),
                type: 'income',
                description: TEXT.initialDeposit,
                amount: newAccount.balance,
                accountId: newAccount.id,
                date: new Date().toISOString().split('T')[0],
                category: 'outros'
            };
            
            // Adiciona a transação ao array
            appState.transactions.push(initialDepositTransaction);
            
            // Salva as transações no localStorage
            saveTransactions();
        }
    }
    
    // Salva as contas no localStorage
    saveAccounts();
    
    // Atualiza a interface
    updateUI();
    
    // Fecha os modais
    closeAllModals();
}

/**
 * Exclui uma conta
 * @param {string} accountId - O ID da conta a ser excluída
 */
function deleteAccount(accountId) {
    // Verifica se há transações associadas a esta conta
    const hasTransactions = appState.transactions.some(transaction => 
        transaction.accountId === accountId || transaction.toAccountId === accountId
    );
    
    // Se houver transações, pergunta ao usuário se deseja excluí-las também
    if (hasTransactions) {
        const confirmDelete = confirm(TEXT.confirmDeleteTransactions);
        
        if (confirmDelete) {
            // Remove todas as transações associadas à conta
            appState.transactions = appState.transactions.filter(transaction => 
                transaction.accountId !== accountId && transaction.toAccountId !== accountId
            );
            
            // Salva as transações no localStorage
            saveTransactions();
        } else {
            // Se o usuário não confirmar, cancela a exclusão
            return;
        }
    }
    
    // Remove a conta do array
    appState.accounts = appState.accounts.filter(account => account.id !== accountId);
    
    // Salva as contas no localStorage
    saveAccounts();
    
    // Atualiza a interface
    updateUI();
}

/**
 * Adiciona uma nova transação
 * @param {Object} transactionData - Os dados da transação a ser adicionada
 */
function addTransaction(transactionData) {
    // Cria uma nova transação com os dados fornecidos
    const newTransaction = {
        id: generateId(),
        type: transactionData.type,
        description: transactionData.description,
        amount: transactionData.amount,
        accountId: transactionData.accountId,
        date: transactionData.date,
        category: transactionData.category
    };
    
    // Se for uma transferência, adiciona o ID da conta de destino
    if (transactionData.type === 'transfer') {
        newTransaction.toAccountId = transactionData.toAccountId;
    }
    
    // Adiciona a transação ao array
    appState.transactions.push(newTransaction);
    
    // Atualiza os saldos das contas
    updateAccountBalances(newTransaction);
    
    // Salva as transações no localStorage
    saveTransactions();
    
    // Salva as contas no localStorage (pois os saldos foram atualizados)
    saveAccounts();
    
    // Atualiza a interface
    updateUI();
    
    // Fecha os modais
    closeAllModals();
}

/**
 * Atualiza os saldos das contas com base em uma transação
 * @param {Object} transaction - A transação que afeta os saldos
 */
function updateAccountBalances(transaction) {
    // Encontra a conta de origem
    const accountIndex = appState.accounts.findIndex(account => account.id === transaction.accountId);
    
    // Se a conta for encontrada
    if (accountIndex !== -1) {
        // Atualiza o saldo com base no tipo de transação
        if (transaction.type === 'income') {
            // Receita: adiciona o valor ao saldo
            appState.accounts[accountIndex].balance += transaction.amount;
        } else if (transaction.type === 'expense') {
            // Despesa: subtrai o valor do saldo
            appState.accounts[accountIndex].balance -= transaction.amount;
        } else if (transaction.type === 'transfer') {
            // Transferência: subtrai o valor do saldo da conta de origem
            appState.accounts[accountIndex].balance -= transaction.amount;
            
            // Encontra a conta de destino
            const toAccountIndex = appState.accounts.findIndex(account => account.id === transaction.toAccountId);
            
            // Se a conta de destino for encontrada, adiciona o valor ao seu saldo
            if (toAccountIndex !== -1) {
                appState.accounts[toAccountIndex].balance += transaction.amount;
            }
        }
    }
}

/**
 * Salva as contas no localStorage
 */
function saveAccounts() {
    const users = getUsersDb();
    const idx = users.findIndex(u => u.username === appState.currentUser);
    if (idx !== -1) {
        users[idx].data = users[idx].data || { accounts: [], transactions: [] };
        users[idx].data.accounts = appState.accounts;
        setUsersDb(users);
    }
}

/**
 * Salva as transações no localStorage
 */
function saveTransactions() {
    const users = getUsersDb();
    const idx = users.findIndex(u => u.username === appState.currentUser);
    if (idx !== -1) {
        users[idx].data = users[idx].data || { accounts: [], transactions: [] };
        users[idx].data.transactions = appState.transactions;
        setUsersDb(users);
    }
}

// ========== FUNÇÕES DE MANIPULAÇÃO DE MODAIS ==========

/**
 * Abre o modal de conta para adicionar ou editar
 * @param {string} [accountId] - O ID da conta a ser editada (opcional)
 */
function openAccountModal(accountId = null) {
    // Define o título do modal
    elements.accountModalTitle.textContent = accountId ? 'Editar Conta' : 'Adicionar Conta';
    
    // Limpa os campos do formulário
    elements.accountForm.reset();
    
    // Se estiver editando uma conta existente
    if (accountId) {
        // Armazena o ID da conta sendo editada
        appState.editingAccountId = accountId;
        
        // Encontra a conta no array
        const account = appState.accounts.find(account => account.id === accountId);
        
        // Se a conta for encontrada, preenche os campos do formulário
        if (account) {
            elements.accountName.value = account.name;
            elements.accountBalance.value = account.balance;
        }
    } else {
        // Limpa o ID da conta sendo editada
        appState.editingAccountId = null;
    }
    
    // Exibe o modal
    elements.accountModal.classList.add('active');
}

/**
 * Abre o modal de transação para adicionar
 * @param {string} type - O tipo de transação ('income', 'expense' ou 'transfer')
 */
function openTransactionModal(type) {
    // Define o tipo de transação
    elements.transactionType.value = type;
    
    // Define o título do modal com base no tipo
    if (type === 'income') {
        elements.transactionModalTitle.textContent = 'Adicionar Receita';
    } else if (type === 'expense') {
        elements.transactionModalTitle.textContent = 'Adicionar Despesa';
    } else if (type === 'transfer') {
        elements.transactionModalTitle.textContent = 'Adicionar Transferência';
    }
    
    // Limpa os campos do formulário
    elements.transactionForm.reset();
    
    // Define a data atual no campo de data
    setCurrentDateInTransactionForm();
    
    // Configura a visibilidade dos campos com base no tipo
    if (type === 'expense') {
        // Para despesas, mostra o campo de categoria
        elements.transactionCategoryGroup.style.display = 'block';
        // Esconde o campo de conta de destino
        elements.transactionToAccountGroup.style.display = 'none';
    } else if (type === 'transfer') {
        // Para transferências, esconde o campo de categoria
        elements.transactionCategoryGroup.style.display = 'none';
        // Mostra o campo de conta de destino
        elements.transactionToAccountGroup.style.display = 'block';
    } else {
        // Para receitas, esconde ambos os campos
        elements.transactionCategoryGroup.style.display = 'none';
        elements.transactionToAccountGroup.style.display = 'none';
    }
    
    // Preenche os selects de contas
    populateAccountSelects();
    
    // Exibe o modal
    elements.transactionModal.classList.add('active');
}

/**
 * Preenche os selects de contas com as contas disponíveis
 */
function populateAccountSelects() {
    // Limpa as opções existentes
    elements.transactionAccount.innerHTML = '';
    elements.transactionToAccount.innerHTML = '';
    
    // Adiciona as opções de conta
    appState.accounts.forEach(account => {
        // Cria a opção para o select de conta de origem
        const option1 = document.createElement('option');
        option1.value = account.id;
        option1.textContent = account.name;
        elements.transactionAccount.appendChild(option1);
        
        // Cria a opção para o select de conta de destino
        const option2 = document.createElement('option');
        option2.value = account.id;
        option2.textContent = account.name;
        elements.transactionToAccount.appendChild(option2);
    });
}

/**
 * Fecha todos os modais
 */
function closeAllModals() {
    // Remove a classe 'active' de todos os modais
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// ========== FUNÇÕES DE MANIPULAÇÃO DE FORMULÁRIOS ==========

/**
 * Manipula o envio do formulário de conta
 * @param {Event} event - O evento de envio do formulário
 */
function handleAccountFormSubmit(event) {
    // Previne o comportamento padrão do formulário
    event.preventDefault();
    
    // Obtém os valores dos campos
    const name = elements.accountName.value.trim();
    const balance = parseFloat(elements.accountBalance.value) || 0;
    
    // Valida os dados
    if (!name) { showToast(TEXT.accountNameRequired, 'warning'); return; }
    
    // Cria o objeto com os dados da conta
    const accountData = {
        name,
        balance
    };
    
    // Salva a conta
    saveAccount(accountData);
}

/**
 * Manipula o envio do formulário de transação
 * @param {Event} event - O evento de envio do formulário
 */
function handleTransactionFormSubmit(event) {
    // Previne o comportamento padrão do formulário
    event.preventDefault();
    
    // Obtém os valores dos campos
    const type = elements.transactionType.value;
    const description = elements.transactionDescription.value.trim();
    const amount = parseFloat(elements.transactionAmount.value) || 0;
    const accountId = elements.transactionAccount.value;
    const date = elements.transactionDate.value;
    
    // Valida os dados
    if (!description) { showToast(TEXT.descriptionRequired, 'warning'); return; }
    
    if (amount <= 0) { showToast(TEXT.amountPositive, 'warning'); return; }
    
    if (!accountId) { showToast(TEXT.accountRequired, 'warning'); return; }
    
    if (!date) { showToast(TEXT.dateRequired, 'warning'); return; }
    
    // Cria o objeto com os dados da transação
    const transactionData = {
        type,
        description,
        amount,
        accountId,
        date
    };
    
    // Adiciona campos específicos com base no tipo
    if (type === 'expense') {
        // Para despesas, adiciona a categoria
        transactionData.category = elements.transactionCategory.value;
    } else if (type === 'transfer') {
        // Para transferências, adiciona a conta de destino
        const toAccountId = elements.transactionToAccount.value;
        
        // Valida a conta de destino
        if (!toAccountId) { showToast(TEXT.destinationAccountRequired, 'warning'); return; }
        
        // Verifica se a conta de destino é diferente da conta de origem
        if (toAccountId === accountId) { showToast(TEXT.differentAccountsRequired, 'warning'); return; }
        
        transactionData.toAccountId = toAccountId;
    } else {
        // Para receitas, define a categoria como 'outros'
        transactionData.category = 'outros';
    }
    
    // Adiciona a transação
    addTransaction(transactionData);
}

// ========== FUNÇÕES DE ALTERNÂNCIA DE IDIOMA E TEMA ==========

 

/**
 * Alterna entre os temas disponíveis
 */
function toggleTheme() {
    // Alterna entre 'light' e 'dark'
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    
    // Salva a preferência no localStorage
    localStorage.setItem('theme', appState.theme);
    
    // Aplica o tema ao elemento body
    document.body.setAttribute('data-theme', appState.theme);
    
    // Atualiza o ícone do botão de tema
    updateThemeToggleIcon();
}

/**
 * Atualiza o ícone do botão de tema com base no tema atual
 */
function updateThemeToggleIcon() {
    // Define o ícone com base no tema
    elements.themeToggle.innerHTML = appState.theme === 'light'
        ? '<span class="material-symbols-outlined">dark_mode</span>'
        : '<span class="material-symbols-outlined">light_mode</span>';
}

// ========== FUNÇÕES ASSÍNCRONAS ==========

/**
 * Carrega uma dica financeira aleatória do arquivo insights.json
 * Esta função usa async/await para demonstrar essa sintaxe
 */
async function loadRandomInsight() {
    try {
        const response = await fetch('insights.json');
        if (!response.ok) {
            throw new Error('Erro ao carregar dicas financeiras');
        }
        const insights = await response.json();

        let randomInsightText = '';

        // Suporta dois formatos:
        // 1) Array de objetos com chaves 'pt' e 'en'
        // 2) Objeto com chaves 'pt' e 'en' apontando para arrays de dicas
        if (Array.isArray(insights)) {
            const randomIndex = Math.floor(Math.random() * insights.length);
            const selected = insights[randomIndex];
            randomInsightText = selected?.pt || selected?.en || '';
        } else {
            const languageInsights = insights?.pt || insights?.en || [];
            const randomIndex = Math.floor(Math.random() * (languageInsights.length || 0));
            randomInsightText = languageInsights?.[randomIndex] || '';
        }

        elements.insightContent.textContent = randomInsightText || TEXT.loading;
    } catch (error) {
        console.error('Erro ao carregar dica financeira:', error);
        elements.insightContent.textContent = TEXT.insightError;
    }
}

/**
 * Carrega a taxa de câmbio atual da API
 * Esta função usa .then() e .catch() para demonstrar essa sintaxe
 */
function loadExchangeRate() {
    // Exibe uma mensagem de carregamento
    elements.exchangeContent.textContent = TEXT.loading;
    
    // Faz a requisição para a API
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(response => {
            // Verifica se a requisição foi bem-sucedida
            if (!response.ok) {
                throw new Error('Erro ao carregar taxa de câmbio');
            }
            return response.json();
        })
        .then(data => {
            // Armazena a taxa de câmbio
            appState.currentExchangeRate = data.rates.BRL;
            
            // Exibe a taxa na interface
            const formattedRate = appState.currentExchangeRate.toFixed(2);
            elements.exchangeContent.textContent = `USD 1 = BRL ${formattedRate}`;
        })
        .catch(error => {
            // Em caso de erro, exibe uma mensagem
            console.error('Erro ao carregar taxa de câmbio:', error);
            elements.exchangeContent.textContent = TEXT.exchangeError;
        });
}

// ========== FUNÇÕES UTILITÁRIAS ==========

/**
 * Gera um ID único
 * @returns {string} - O ID gerado
 */
function generateId() {
    // Gera um ID baseado no timestamp atual e um número aleatório
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Formata um valor para exibição como moeda
 * @param {number} value - O valor a ser formatado
 * @returns {string} - O valor formatado
 */
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function showToast(msg, type = 'info') {
    const c = elements.toastContainer || document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.remove(); }, 3500);
}

// ===== Autenticação e inicialização =====
const STORAGE = { USERS_DB: 'users_db', CURRENT_USER: 'current_user' };

function getUsersDb() {
    try { return JSON.parse(localStorage.getItem(STORAGE.USERS_DB)) || []; }
    catch { return []; }
}

function setUsersDb(users) {
    localStorage.setItem(STORAGE.USERS_DB, JSON.stringify(users));
}

function showAuthScreen() {
    if (elements.appScreen) elements.appScreen.style.display = 'none';
    if (elements.authScreen) elements.authScreen.style.display = 'flex';
}

function showAppScreen() {
    if (elements.authScreen) elements.authScreen.style.display = 'none';
    if (elements.appScreen) elements.appScreen.style.display = 'block';
}

function boot() {
    loadSettings();
    setupEventListeners();
    setupHideOnScrollHeader();
    const storedUser = localStorage.getItem(STORAGE.CURRENT_USER);
    if (storedUser) {
        appState.currentUser = storedUser;
        loadUserData();
        showAppScreen();
        postLoginInit();
    } else {
        showAuthScreen();
    }
}

function postLoginInit() {
    elements.appTitle.textContent = `Olá, ${appState.currentUser}`;
    updateCategoryOptions();
    updateUI();
    loadRandomInsight();
    loadExchangeRate();
    setCurrentDateInTransactionForm();
}

// Alterna entre modo Login e Cadastro na tela de autenticação
function toggleAuthMode() {
    const card = document.getElementById('auth-card');
    const titleEl = document.getElementById('auth-title');
    const loginBtn = document.getElementById('auth-login-btn');
    const registerBtn = document.getElementById('auth-register-btn');
    const toggleLink = document.getElementById('auth-toggle-link');
    const username = document.getElementById('auth-username');
    const password = document.getElementById('auth-password');

    if (!card || !titleEl || !loginBtn || !registerBtn || !toggleLink) return;

    const isRegister = card.classList.toggle('mode-register');

    if (isRegister) {
        titleEl.textContent = 'Criar Conta';
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'inline-flex';
        toggleLink.textContent = 'Já tem conta? Entrar';
    } else {
        titleEl.textContent = 'Entrar';
        loginBtn.style.display = 'inline-flex';
        registerBtn.style.display = 'none';
        toggleLink.textContent = 'Não tem conta? Criar agora';
    }

    // Limpa os campos ao alternar
    if (username) username.value = '';
    if (password) password.value = '';
}

function loginUser(username, password) {
    if (!username || !password) return;
    const users = getUsersDb();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        appState.currentUser = username;
        localStorage.setItem(STORAGE.CURRENT_USER, username);
        loadUserData();
        showAppScreen();
        postLoginInit();
    } else {
        showToast('Usuário ou senha inválidos.', 'error');
    }
}

function registerUser(username, password) {
    if (!username || !password) return;
    const users = getUsersDb();
    if (users.some(u => u.username === username)) {
        showToast('Usuário já existe.', 'warning');
        return;
    }
    users.push({ username, password, data: { accounts: [], transactions: [] } });
    setUsersDb(users);
    loginUser(username, password);
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', boot);
