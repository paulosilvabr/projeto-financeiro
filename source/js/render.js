/* ==========================================================================
   RENDERIZAÇÃO DA UI (VIEW)
   --------------------------------------------------------------------------
   Responsável por desenhar os elementos na tela com base no estado atual.
   ========================================================================== */

import { appState, TEXT, CATEGORY_LABEL_PT } from './state.js';
import { formatCurrency, showConfirmModal } from './utils.js';
import { openAccountModal, updateWidgetsVisibility } from './modals.js';
import { renderExpensesChart, renderAllSparklines } from './charts.js';

// ==========================================================================
// 1. HELPERS DE RENDERIZAÇÃO
// ==========================================================================

/**
 * Popula o select de categorias no formulário com as opções definidas no sistema.
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
 * Preenche o filtro de contas na barra lateral (Sidebar) com as contas do usuário.
 */
export function populateSidebarAccountFilter() {
  const sel = document.getElementById('sidebar-account-filter');
  if (!sel) return;
  sel.innerHTML = '';
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'Todas as Contas';
  sel.appendChild(allOption);
  appState.accounts.forEach(account => {
    const option = document.createElement('option');
    option.value = account.id;
    option.textContent = account.name;
    sel.appendChild(option);
  });
  sel.value = appState.activeAccountFilter;
}

/**
 * Retorna a lista de transações filtrada com base nos filtros ativos (Mês e Conta).
 * É a fonte de verdade para o que deve ser exibido na lista e nos totais.
 * @returns {Array} Lista filtrada de transações.
 */
export function getFilteredTransactions() {
  let result = [...appState.transactions];
  if (appState.activeAccountFilter && appState.activeAccountFilter !== 'all') {
    const sel = appState.activeAccountFilter;
    result = result.filter(t => t.accountId === sel || t.toAccountId === sel);
  }
  if (appState.activeMonthFilter) {
    const now = new Date();
    let targetMonth = now.getMonth();
    let targetYear = now.getFullYear();
    if (appState.activeMonthFilter === 'prev') {
      if (targetMonth === 0) { targetMonth = 11; targetYear -= 1; } else { targetMonth -= 1; }
    }
    result = result.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });
  }
  return result;
}

// ==========================================================================
// 2. RENDERIZAÇÃO DE CONTAS
// ==========================================================================

/**
 * Limpa e redesenha a lista de cartões de contas bancárias na tela.
 * Exibe mensagem de "vazio" se não houver contas.
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
 * Cria o elemento HTML (Card) para uma conta específica.
 * Adiciona os ouvintes de evento para os botões Editar e Excluir.
 * @param {Object} account - Dados da conta.
 * @returns {HTMLElement} Elemento div do card construído.
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
  const editBtn = document.createElement('button');
  editBtn.className = 'icon-button';
  editBtn.innerHTML = '<span class="material-symbols-outlined">edit</span>';
  editBtn.addEventListener('click', () => openAccountModal(account.id));
  actions.appendChild(editBtn);
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'icon-button';
  deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
  deleteBtn.addEventListener('click', () => {
    showConfirmModal(TEXT.confirmDeleteAccount, () => {
      import('./storage.js').then(({ deleteAccount }) => { deleteAccount(account.id); updateUI(); });
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
// 3. RENDERIZAÇÃO DE TRANSAÇÕES
// ==========================================================================

/**
 * Limpa e redesenha a lista de transações na tela.
 * Respeita a paginação simples (mostrar 5 ou todas).
 */
export function renderTransactions() {
  const list = document.getElementById('transactions-list');
  if (!list) return;
  list.innerHTML = '';
  const filtered = getFilteredTransactions();
  if (filtered.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty-message';
    p.textContent = TEXT.noTransactions;
    list.appendChild(p);
    return;
  }
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
  const showAll = !!appState.showAllTransactions;
  const items = showAll ? sorted : sorted.slice(0, 5);
  items.forEach(transaction => { list.appendChild(createTransactionItem(transaction)); });
  if (!showAll && sorted.length > 5) {
    const more = document.createElement('button');
    more.className = 'btn secondary';
    more.textContent = 'Mostrar Histórico Completo';
    more.addEventListener('click', () => { appState.showAllTransactions = true; renderTransactions(); });
    list.appendChild(more);
  }
}

/**
 * Cria o elemento HTML (Item de Lista) para uma transação.
 * Aplica classes de cor (verde/vermelho) e ícones dependendo do tipo.
 * @param {Object} transaction - Dados da transação.
 * @returns {HTMLElement} Elemento div do item construído.
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
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const del = document.createElement('button');
  del.className = 'icon-button transaction-delete';
  del.innerHTML = '<span class="material-symbols-outlined">delete</span>';
  del.addEventListener('click', () => {
    showConfirmModal('Deseja excluir esta transação?', () => {
      import('./storage.js').then(({ deleteTransaction }) => { deleteTransaction(transaction.id); updateUI(); });
    });
  });
  actions.appendChild(del);
  item.appendChild(actions);
  const details = document.createElement('div');
  details.className = 'transaction-details';
  const date = document.createElement('span');
  date.className = 'transaction-date';
  date.textContent = new Date(transaction.date).toLocaleDateString();
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
  const amount = document.createElement('p');
  amount.className = 'transaction-amount';
  if (transaction.type === 'income') { amount.textContent = `+${formatCurrency(transaction.amount)}`; }
  else if (transaction.type === 'expense') { amount.textContent = `-${formatCurrency(transaction.amount)}`; }
  else { amount.textContent = formatCurrency(transaction.amount); }
  item.appendChild(amount);
  return item;
}

// ==========================================================================
// 4. ATUALIZAÇÃO DA UI (CARDS E TOTAIS)
// ==========================================================================

/**
 * Calcula a soma dos saldos das contas (considerando filtros) e atualiza o display.
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
 * Atualiza todos os cards de resumo do topo (Saldo Total, Receitas, Despesas)
 * baseando-se nas transações filtradas do período.
 */
export function updateSummaryCards() {
  updateTotalBalance();
  const filtered = getFilteredTransactions();
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const inc = document.getElementById('total-income-value');
  const exp = document.getElementById('total-expense-value');
  if (inc) inc.textContent = formatCurrency(totalIncome);
  if (exp) exp.textContent = formatCurrency(totalExpense);
}

/**
 * Função Mestre de Renderização.
 * Chama todas as sub-funções de renderização para atualizar a interface completa.
 * Deve ser chamada sempre que os dados mudarem.
 */
export function updateUI() {
  renderAccounts();
  renderTransactions();
  populateSidebarAccountFilter();
  updateSummaryCards();
  
  const filteredData = getFilteredTransactions();
  
  renderExpensesChart(filteredData);
  renderAllSparklines(filteredData);
  
  updateWidgetsVisibility();
}
