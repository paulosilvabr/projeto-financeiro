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
    language: 'pt', // Idioma padrão
    theme: 'light', // Tema padrão
    accounts: [], // Array para armazenar as contas
    transactions: [], // Array para armazenar as transações
    currentExchangeRate: null, // Taxa de câmbio atual
    editingAccountId: null, // ID da conta sendo editada (null quando não estiver editando)
};

/**
 * Elementos DOM frequentemente utilizados
 * Armazenamos referências aos elementos para evitar buscá-los repetidamente
 */
const elements = {
    // Elementos de idioma e tema
    appTitle: document.getElementById('app-title'),
    languageToggle: document.getElementById('language-toggle'),
    themeToggle: document.getElementById('theme-toggle'),
    
    // Elementos de resumo
    totalBalanceLabel: document.getElementById('total-balance-label'),
    totalBalanceValue: document.getElementById('total-balance-value'),
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
}

/**
 * Carrega as configurações salvas do localStorage
 * Configurações incluem idioma e tema preferido
 */
function loadSettings() {
    // Tenta obter o idioma salvo, ou usa o padrão 'pt'
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
        appState.language = savedLanguage;
    }
    
    // Tenta obter o tema salvo, ou usa o padrão 'light'
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
    // Tenta obter as contas salvas, ou usa um array vazio
    const savedAccounts = localStorage.getItem('accounts');
    if (savedAccounts) {
        appState.accounts = JSON.parse(savedAccounts);
    }
    
    // Tenta obter as transações salvas, ou usa um array vazio
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
        appState.transactions = JSON.parse(savedTransactions);
    }
}

/**
 * Configura todos os event listeners da aplicação
 * Event listeners são funções que respondem a eventos como cliques
 */
function setupEventListeners() {
    // Event listeners para alternar idioma e tema
    elements.languageToggle.addEventListener('click', toggleLanguage);
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
    // Atualiza os textos com base no idioma selecionado
    updateTexts();
    
    // Renderiza as contas
    renderAccounts();
    
    // Renderiza as transações
    renderTransactions();
    
    // Atualiza o saldo total
    updateTotalBalance();
    
    // Renderiza o gráfico de despesas
    renderExpensesChart();
}

/**
 * Atualiza todos os textos da interface com base no idioma selecionado
 */
function updateTexts() {
    // Obtém o objeto de traduções para o idioma atual
    const texts = translations[appState.language];
    
    // Atualiza o título da página
    document.title = texts.title;
    elements.appTitle.textContent = texts.title;
    
    // Atualiza os textos da seção de resumo
    elements.totalBalanceLabel.textContent = texts.totalBalance;
    elements.insightLabel.textContent = texts.financialTip;
    elements.exchangeLabel.textContent = texts.exchangeRate;
    
    // Atualiza os textos da seção de contas
    elements.accountsLabel.textContent = texts.myAccounts;
    elements.addAccountText.textContent = texts.addAccount;
    
    // Atualiza os textos da seção de transações
    elements.transactionsLabel.textContent = texts.transactions;
    elements.addIncomeText.textContent = texts.income;
    elements.addExpenseText.textContent = texts.expense;
    elements.addTransferText.textContent = texts.transfer;
    
    // Atualiza os textos da seção de análise
    elements.expensesAnalysisLabel.textContent = texts.expensesAnalysis;
    
    // Atualiza os textos do modal de conta
    elements.accountNameLabel.textContent = texts.accountName;
    elements.accountBalanceLabel.textContent = texts.initialBalance;
    elements.cancelAccountBtn.textContent = texts.cancel;
    elements.saveAccountBtn.textContent = texts.save;
    
    // Atualiza os textos do modal de transação
    elements.transactionDescriptionLabel.textContent = texts.description;
    elements.transactionAmountLabel.textContent = texts.amount;
    elements.transactionCategoryLabel.textContent = texts.category;
    elements.transactionAccountLabel.textContent = texts.account;
    elements.transactionToAccountLabel.textContent = texts.destinationAccount;
    elements.transactionDateLabel.textContent = texts.date;
    elements.cancelTransactionBtn.textContent = texts.cancel;
    elements.saveTransactionBtn.textContent = texts.save;
    
    // Atualiza as opções de categoria
    updateCategoryOptions();
}

/**
 * Atualiza as opções de categoria no select de categorias
 */
function updateCategoryOptions() {
    // Obtém o objeto de traduções para o idioma atual
    const texts = translations[appState.language];
    
    // Limpa as opções existentes
    elements.transactionCategory.innerHTML = '';
    
    // Adiciona as novas opções traduzidas
    const categories = [
        { value: 'housing', text: texts.housing },
        { value: 'food', text: texts.food },
        { value: 'transportation', text: texts.transportation },
        { value: 'leisure', text: texts.leisure },
        { value: 'health', text: texts.health },
        { value: 'education', text: texts.education },
        { value: 'others', text: texts.others }
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
        emptyMessage.textContent = translations[appState.language].noAccounts;
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
        if (confirm(translations[appState.language].confirmDeleteAccount)) {
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
    
    // Se não houver transações, exibe uma mensagem
    if (appState.transactions.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = translations[appState.language].noTransactions;
        elements.transactionsList.appendChild(emptyMessage);
        return;
    }
    
    // Ordena as transações por data (mais recentes primeiro)
    const sortedTransactions = [...appState.transactions].sort((a, b) => {
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
        category.textContent = translations[appState.language][transaction.category];
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
    // Calcula o saldo total somando os saldos de todas as contas
    const totalBalance = appState.accounts.reduce((total, account) => {
        return total + account.balance;
    }, 0);
    
    // Atualiza o valor na interface
    elements.totalBalanceValue.textContent = formatCurrency(totalBalance);
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
    const labels = categories.map(category => translations[appState.language][category]);
    
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
                    description: translations[appState.language].balanceAdjustment,
                    amount: transactionAmount,
                    accountId: appState.editingAccountId,
                    date: new Date().toISOString().split('T')[0],
                    category: 'others'
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
                description: translations[appState.language].initialDeposit,
                amount: newAccount.balance,
                accountId: newAccount.id,
                date: new Date().toISOString().split('T')[0],
                category: 'others'
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
        const confirmDelete = confirm(translations[appState.language].confirmDeleteTransactions);
        
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
    localStorage.setItem('accounts', JSON.stringify(appState.accounts));
}

/**
 * Salva as transações no localStorage
 */
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(appState.transactions));
}

// ========== FUNÇÕES DE MANIPULAÇÃO DE MODAIS ==========

/**
 * Abre o modal de conta para adicionar ou editar
 * @param {string} [accountId] - O ID da conta a ser editada (opcional)
 */
function openAccountModal(accountId = null) {
    // Define o título do modal
    elements.accountModalTitle.textContent = accountId 
        ? translations[appState.language].editAccount 
        : translations[appState.language].addAccount;
    
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
        elements.transactionModalTitle.textContent = translations[appState.language].addIncome;
    } else if (type === 'expense') {
        elements.transactionModalTitle.textContent = translations[appState.language].addExpense;
    } else if (type === 'transfer') {
        elements.transactionModalTitle.textContent = translations[appState.language].addTransfer;
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
    if (!name) {
        alert(translations[appState.language].accountNameRequired);
        return;
    }
    
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
    if (!description) {
        alert(translations[appState.language].descriptionRequired);
        return;
    }
    
    if (amount <= 0) {
        alert(translations[appState.language].amountPositive);
        return;
    }
    
    if (!accountId) {
        alert(translations[appState.language].accountRequired);
        return;
    }
    
    if (!date) {
        alert(translations[appState.language].dateRequired);
        return;
    }
    
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
        if (!toAccountId) {
            alert(translations[appState.language].destinationAccountRequired);
            return;
        }
        
        // Verifica se a conta de destino é diferente da conta de origem
        if (toAccountId === accountId) {
            alert(translations[appState.language].differentAccountsRequired);
            return;
        }
        
        transactionData.toAccountId = toAccountId;
    } else {
        // Para receitas, define a categoria como 'others'
        transactionData.category = 'others';
    }
    
    // Adiciona a transação
    addTransaction(transactionData);
}

// ========== FUNÇÕES DE ALTERNÂNCIA DE IDIOMA E TEMA ==========

/**
 * Alterna entre os idiomas disponíveis
 */
function toggleLanguage() {
    // Alterna entre 'pt' e 'en'
    appState.language = appState.language === 'pt' ? 'en' : 'pt';
    
    // Salva a preferência no localStorage
    localStorage.setItem('language', appState.language);
    
    // Atualiza a interface
    updateUI();
    
    // Recarrega a dica financeira e a taxa de câmbio
    loadRandomInsight();
    loadExchangeRate();
}

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
            randomInsightText = selected?.[appState.language] || selected?.pt || selected?.en || '';
        } else {
            const languageInsights = insights?.[appState.language];
            const randomIndex = Math.floor(Math.random() * (languageInsights?.length || 0));
            randomInsightText = languageInsights?.[randomIndex] || '';
        }

        elements.insightContent.textContent = randomInsightText || translations[appState.language].loading;
    } catch (error) {
        console.error('Erro ao carregar dica financeira:', error);
        elements.insightContent.textContent = translations[appState.language].insightError;
    }
}

/**
 * Carrega a taxa de câmbio atual da API
 * Esta função usa .then() e .catch() para demonstrar essa sintaxe
 */
function loadExchangeRate() {
    // Exibe uma mensagem de carregamento
    elements.exchangeContent.textContent = translations[appState.language].loading;
    
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
            elements.exchangeContent.textContent = translations[appState.language].exchangeError;
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
    // Formata o valor com base no idioma
    if (appState.language === 'pt') {
        // Formato brasileiro: R$ 1.234,56
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    } else {
        // Formato americano: $1,234.56
        return value.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    }
}

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initApp);