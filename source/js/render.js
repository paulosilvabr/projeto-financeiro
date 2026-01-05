/* ==========================================================================
   RENDERIZAÇÃO DA UI (VIEW)
   --------------------------------------------------------------------------
   Responsável por desenhar os elementos na tela com base no estado atual.
   ========================================================================== */

import { appState, TEXT, CATEGORY_LABEL_PT } from './state.js';
import { formatCurrency, showConfirmModal } from './utils.js';
import { openAccountModal, updateWidgetsVisibility, openHistoryModal } from './modals.js';
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
  
  // Salva a seleção atual para não perder ao redesenhar
  // Se não houver seleção no DOM, usa o estado global
  const currentSelection = appState.activeAccountFilter || 'all';
  
  sel.innerHTML = '';
  
  // Opção "Todas"
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'Todas as Contas';
  sel.appendChild(allOption);
  
  // Opções das Contas
  appState.accounts.forEach(account => {
    const option = document.createElement('option');
    option.value = account.id;
    option.textContent = account.name;
    sel.appendChild(option);
  });
  
  // Restaura a seleção
  sel.value = currentSelection;
}

/**
 * Retorna a lista de transações filtrada.
 * @param {boolean} ignoreMonth - Se true, ignora o filtro de mês (útil para gráficos de histórico).
 * @returns {Array} Lista filtrada de transações.
 */
export function getFilteredTransactions(ignoreMonth = false) {
  let result = [...appState.transactions];

  // 1. Filtro de Conta
  if (appState.activeAccountFilter && appState.activeAccountFilter !== 'all') {
    const sel = appState.activeAccountFilter;
    result = result.filter(t => t.accountId === sel || t.toAccountId === sel);
  }

  // 2. Filtro de Mês (Opcional - Chart usa ignoreMonth=true)
  if (!ignoreMonth && appState.activeMonthFilter) {
    const now = new Date();
    let targetMonth = now.getMonth();
    let targetYear = now.getFullYear();
    
    if (appState.activeMonthFilter === 'prev') {
      if (targetMonth === 0) { targetMonth = 11; targetYear -= 1; } 
      else { targetMonth -= 1; }
    }
    
    result = result.filter(t => {
      const [y, m, d] = t.date.split('-').map(Number);
      return (m - 1) === targetMonth && y === targetYear;
    });
  }

  // 3. Filtro de Busca
  if (appState.filterTerm) {
    const normalize = (str) => str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "");

    const term = normalize(appState.filterTerm);
    
    result = result.filter(t => normalize(t.description).includes(term));
  }

  // 4. Filtro de Tipo
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
      case 'date-asc':   return dateA - dateB;
      case 'amount-desc':return b.amount - a.amount;
      case 'amount-asc': return a.amount - b.amount;
      case 'date-desc': 
      default:           return dateB - dateA;
    }
  });

  return result;
}

// ==========================================================================
// 2. RENDERIZAÇÃO DE CONTAS
// ==========================================================================

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
// 3. RENDERIZAÇÃO DE TRANSAÇÕES
// ==========================================================================

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
      import('./storage.js').then(({ deleteTransaction }) => { 
          deleteTransaction(transaction.id); 
          updateUI(); 
      });
    });
  });
  actions.appendChild(del);
  item.appendChild(actions);
  
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
  
  const amount = document.createElement('p');
  amount.className = 'transaction-amount';
  if (transaction.type === 'income') { amount.textContent = `+${formatCurrency(transaction.amount)}`; }
  else if (transaction.type === 'expense') { amount.textContent = `-${formatCurrency(transaction.amount)}`; }
  else { amount.textContent = formatCurrency(transaction.amount); }
  item.appendChild(amount);
  
  return item;
}

export function renderHistoryDrawer() {
  const list = document.getElementById('full-history-list');
  if (!list) return;
  list.innerHTML = '';
  
  // Histórico na gaveta usa o filtro padrão (incluindo mês)
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
// 4. ATUALIZAÇÃO DA UI (CARDS E TOTAIS)
// ==========================================================================

export function updateTotalBalance() {
  const accountsToSum = (appState.activeAccountFilter && appState.activeAccountFilter !== 'all')
    ? appState.accounts.filter(acc => acc.id === appState.activeAccountFilter)
    : appState.accounts;
  const totalBalance = accountsToSum.reduce((total, account) => total + account.balance, 0);
  const el = document.getElementById('total-balance-value');
  if (el) el.textContent = formatCurrency(totalBalance);
}

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

/**
 * Função Mestre de Renderização.
 * Chama todas as sub-funções para atualizar a interface completa.
 */
export function updateUI() {
  renderAccounts();
  renderTransactions();
  
  // --- CORREÇÃO: O SELECT DEVE SER POPULADO ---
  // A função populateSidebarAccountFilter já possui lógica interna 
  // para preservar a seleção atual (appState.activeAccountFilter),
  // então é seguro chamá-la aqui para garantir que novas contas apareçam.
  populateSidebarAccountFilter(); 
  
  updateSummaryCards();
  
  // 1. Dados para a Lista e Gráfico de Rosca (Respeita o Mês Selecionado)
  const filteredData = getFilteredTransactions(false);
  renderExpensesChart(filteredData);
  
  // 2. Dados para Sparklines (Ignora Mês para fazer curva de 30 dias, mas respeita Conta/Busca)
  const chartData = getFilteredTransactions(true);
  renderAllSparklines(chartData);
  
  updateWidgetsVisibility();
}