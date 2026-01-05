/* ==========================================================================
   RENDERIZAÇÃO DA UI (RENDER.JS)
   --------------------------------------------------------------------------
   Camada de visualização (View). Responsável por manipular o DOM,
   desenhar listas, cards e atualizar totais na tela.
   ========================================================================== */

import { appState, TEXT, CATEGORY_LABEL_PT } from './state.js';
import { formatCurrency, showConfirmModal } from './utils.js';
import { openAccountModal, updateWidgetsVisibility, openHistoryModal } from './modals.js';
import { renderExpensesChart, renderAllSparklines } from './charts.js';

// ==========================================================================
// 1. HELPERS DE INTERFACE (Selects e Filtros)
// ==========================================================================

/**
 * Preenche o select de categorias no modal de transação.
 * Garante que as opções estejam sempre sincronizadas com o sistema.
 */
export function updateCategoryOptions() {
    const sel = document.getElementById('transaction-category');
    if (!sel) return;

    sel.innerHTML = '';
    const categories = [
        { value: 'moradia', text: 'Moradia' },
        { value: 'alimentacao', text: 'Alimentação' },
        { value: 'transporte', text: 'Transporte' },
        { value: 'lazer', text: 'Lazer' },
        { value: 'saude', text: 'Saúde' },
        { value: 'educacao', text: 'Educação' },
        { value: 'outros', text: 'Outros' }
    ];

    categories.forEach(c => {
        const o = document.createElement('option');
        o.value = c.value;
        o.textContent = c.text;
        sel.appendChild(o);
    });
}

/**
 * Atualiza as opções do filtro de contas na barra lateral (Sidebar).
 * Mantém a seleção atual do usuário mesmo após redesenhar.
 */
export function populateSidebarAccountFilter() {
    const sel = document.getElementById('sidebar-account-filter');
    if (!sel) return;

    // Preserva a seleção atual para não resetar a UX
    const currentSelection = appState.activeAccountFilter || 'all';

    sel.innerHTML = '';

    // Opção Padrão: Todas
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Todas as Contas';
    sel.appendChild(allOption);

    // Lista de Contas
    appState.accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = account.name;
        sel.appendChild(option);
    });

    // Restaura seleção
    sel.value = currentSelection;
}

/**
 * Filtra e ordena as transações com base no estado atual (appState).
 * @param {boolean} ignoreMonth - Se true, ignora o filtro de mês (usado para gráficos de histórico).
 * @returns {Array<Object>} Lista filtrada de transações.
 */
export function getFilteredTransactions(ignoreMonth = false) {
    let result = [...appState.transactions];

    // 1. Filtro de Conta (Origem ou Destino)
    if (appState.activeAccountFilter && appState.activeAccountFilter !== 'all') {
        const sel = appState.activeAccountFilter;
        result = result.filter(t => t.accountId === sel || t.toAccountId === sel);
    }

    // 2. Filtro de Mês (Opcional)
    if (!ignoreMonth && appState.activeMonthFilter) {
        const now = new Date();
        let targetMonth = now.getMonth();
        let targetYear = now.getFullYear();

        if (appState.activeMonthFilter === 'prev') {
            if (targetMonth === 0) {
                targetMonth = 11;
                targetYear -= 1;
            } else {
                targetMonth -= 1;
            }
        }

        result = result.filter(t => {
            const [y, m, d] = t.date.split('-').map(Number);
            return (m - 1) === targetMonth && y === targetYear;
        });
    }

    // 3. Filtro de Busca Textual
    if (appState.filterTerm) {
        const normalize = (str) => str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "");

        const term = normalize(appState.filterTerm);

        result = result.filter(t => normalize(t.description).includes(term));
    }

    // 4. Filtro de Tipo (Receita, Despesa, Transferência)
    if (appState.filterTypes && appState.filterTypes.length > 0) {
        result = result.filter(t => appState.filterTypes.includes(t.type));
    }

    // 5. Filtro de Categoria
    if (appState.filterCategory && appState.filterCategory !== 'all') {
        result = result.filter(t => t.category === appState.filterCategory);
    }

    // 6. Ordenação
    result.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        switch (appState.filterSort) {
            case 'date-asc': if ((dateA - dateB) === 0) a.id.localeCompare(b.id); return dateA - dateB;
            case 'amount-desc': return b.amount - a.amount;
            case 'amount-asc': return a.amount - b.amount;
            case 'date-desc': 
            default: 
                const diff = dateB - dateA;
                if (diff === 0) {
                    return b.id.localeCompare(a.id)
                }
                return diff
        }
    });

    return result;
}

// ==========================================================================
// 2. RENDERIZAÇÃO: CONTAS
// ==========================================================================

/**
 * Desenha a grade de cards de contas bancárias.
 */
export function renderAccounts() {
    const list = document.getElementById('accounts-list');
    if (!list) return;
    list.innerHTML = '';

    if (appState.accounts.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty-message';
        p.textContent = TEXT.noAccounts;
        list.appendChild(p);
        return;
    }

    appState.accounts.forEach(account => {
        list.appendChild(createAccountCard(account));
    });
}

/**
 * Cria o elemento HTML de um card de conta individual.
 * @param {Object} account - Dados da conta.
 * @returns {HTMLElement} Elemento DOM do card.
 */
export function createAccountCard(account) {
    const card = document.createElement('div');
    card.className = 'card account-card';
    card.dataset.id = account.id;

    const header = document.createElement('div');
    header.className = 'card-header';

    const title = document.createElement('h3');
    title.textContent = account.name;
    header.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    // Botão Editar
    const editBtn = document.createElement('button');
    editBtn.className = 'icon-button';
    editBtn.innerHTML = '<span class="material-symbols-outlined">edit</span>';
    editBtn.addEventListener('click', () => openAccountModal(account.id));
    actions.appendChild(editBtn);

    // Botão Excluir
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-button';
    deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
    deleteBtn.addEventListener('click', () => {
        showConfirmModal(TEXT.confirmDeleteAccount, () => {
            import('./storage.js').then(({ deleteAccount }) => {
                deleteAccount(account.id);
                updateUI();
            });
        });
    });
    actions.appendChild(deleteBtn);

    header.appendChild(actions);
    card.appendChild(header);

    const content = document.createElement('div');
    content.className = 'card-content';
    const balance = document.createElement('p');
    balance.className = 'account-balance';
    balance.textContent = formatCurrency(account.balance);
    content.appendChild(balance);
    card.appendChild(content);

    return card;
}

// ==========================================================================
// 3. RENDERIZAÇÃO: TRANSAÇÕES
// ==========================================================================

/**
 * Desenha a lista de transações recentes no dashboard.
 * Limita a 5 itens, a menos que o usuário clique em "Mostrar Mais".
 */
export function renderTransactions() {
    const list = document.getElementById('transactions-list');
    if (!list) return;
    list.innerHTML = '';

    const filtered = getFilteredTransactions(false); // Respeita o filtro de mês

    if (filtered.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty-message';
        p.textContent = TEXT.noTransactions;
        list.appendChild(p);
        return;
    }

    const showAll = !!appState.showAllTransactions;
    const items = showAll ? filtered : filtered.slice(0, 5);

    items.forEach(transaction => {
        list.appendChild(createTransactionItem(transaction));
    });

    // Botão "Mostrar Mais" se houver itens ocultos
    if (!showAll && filtered.length > 5) {
        const more = document.createElement('button');
        more.className = 'btn-full-row';
        more.textContent = `Mostrar mais (${filtered.length - 5})`;
        more.addEventListener('click', () => {
            openHistoryModal();
        });
        list.appendChild(more);
    }
}

/**
 * Cria o elemento HTML de uma linha de transação.
 * @param {Object} transaction - Dados da transação.
 * @returns {HTMLElement} Elemento DOM da linha.
 */
export function createTransactionItem(transaction) {
    const item = document.createElement('div');
    item.className = `transaction-item ${transaction.type}`;
    item.dataset.id = transaction.id;

    const content = document.createElement('div');
    content.className = 'transaction-content';

    const description = document.createElement('p');
    description.className = 'transaction-description';
    description.textContent = transaction.description;
    content.appendChild(description);

    // Botão Excluir (Hover)
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const del = document.createElement('button');
    del.className = 'icon-button transaction-delete';
    del.innerHTML = '<span class="material-symbols-outlined">delete</span>';
    del.addEventListener('click', () => {
        showConfirmModal('Deseja excluir esta transação?', () => {
            import('./storage.js').then(({ deleteTransaction }) => {
                deleteTransaction(transaction.id);
                updateUI();
            });
        });
    });
    actions.appendChild(del);
    item.appendChild(actions);

    // Detalhes (Data, Categoria, Conta)
    const details = document.createElement('div');
    details.className = 'transaction-details';

    const date = document.createElement('span');
    date.className = 'transaction-date';
    const [y, m, d] = transaction.date.split('-');
    date.textContent = `${d}/${m}/${y}`;
    details.appendChild(date);

    if (transaction.type === 'expense' && transaction.category) {
        const category = document.createElement('span');
        category.className = 'transaction-category';
        category.textContent = CATEGORY_LABEL_PT[transaction.category] || transaction.category;
        details.appendChild(category);
    }

    const account = appState.accounts.find(acc => acc.id === transaction.accountId);
    if (account) {
        const accountElement = document.createElement('span');
        accountElement.className = 'transaction-account';
        accountElement.textContent = account.name;
        details.appendChild(accountElement);

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

    // Valor Formatado
    const amount = document.createElement('p');
    amount.className = 'transaction-amount';
    if (transaction.type === 'income') {
        amount.textContent = `+${formatCurrency(transaction.amount)}`;
    } else if (transaction.type === 'expense') {
        amount.textContent = `-${formatCurrency(transaction.amount)}`;
    } else {
        amount.textContent = formatCurrency(transaction.amount);
    }
    item.appendChild(amount);

    return item;
}

/**
 * Renderiza a lista completa de transações dentro do modal de histórico.
 */
export function renderHistoryDrawer() {
    const list = document.getElementById('full-history-list');
    if (!list) return;
    list.innerHTML = '';

    // Histórico completo usa os filtros atuais (incluindo mês)
    let filtered = getFilteredTransactions(false);

    if (filtered.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty-message';
        p.textContent = 'Nenhuma transação encontrada.';
        list.appendChild(p);
        return;
    }

    filtered.forEach(t => {
        list.appendChild(createTransactionItem(t));
    });
}

// ==========================================================================
// 4. ATUALIZAÇÃO DE TOTAIS E CARDS
// ==========================================================================

/**
 * Calcula e exibe o saldo total das contas filtradas.
 */
export function updateTotalBalance() {
    const accountsToSum = (appState.activeAccountFilter && appState.activeAccountFilter !== 'all')
        ? appState.accounts.filter(acc => acc.id === appState.activeAccountFilter)
        : appState.accounts;

    const totalBalance = accountsToSum.reduce((total, account) => total + account.balance, 0);
    const el = document.getElementById('total-balance-value');
    
    if (el) el.textContent = formatCurrency(totalBalance);
}

/**
 * Atualiza os cards de Receita Total e Despesa Total com base no filtro atual.
 */
export function updateSummaryCards() {
    updateTotalBalance();
    
    const filtered = getFilteredTransactions(false); // Respeita o mês
    const totalIncome = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const inc = document.getElementById('total-income-value');
    const exp = document.getElementById('total-expense-value');

    if (inc) inc.textContent = formatCurrency(totalIncome);
    if (exp) exp.textContent = formatCurrency(totalExpense);
}

// ==========================================================================
// 5. MASTER RENDER (UPDATE UI)
// ==========================================================================

/**
 * Função principal de atualização da interface.
 * Deve ser chamada sempre que o estado (dados ou filtros) mudar.
 * Orquestra o redesenho de listas, gráficos e totais.
 */
export function updateUI() {
    renderAccounts();
    renderTransactions();
    populateSidebarAccountFilter();
    updateSummaryCards();

    // 1. Dados para a Lista e Gráfico de Rosca (Respeita o Mês Selecionado)
    const filteredData = getFilteredTransactions(false);
    renderExpensesChart(filteredData);

    // 2. Dados para Sparklines (Ignora Mês para fazer curva de 30 dias)
    // Isso garante que o gráfico de linha mostre a tendência histórica
    const chartData = getFilteredTransactions(true);
    renderAllSparklines(chartData);

    updateWidgetsVisibility();
}