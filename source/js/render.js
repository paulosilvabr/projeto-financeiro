import { appState, TEXT, CATEGORY_LABEL_PT } from './state.js';
import { formatCurrency, showConfirmModal, generateRandomColor, getChartColors, setChartColors } from './utils.js';

export function setCurrentDateInTransactionForm() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${day}/${month}/${year}`;
  const el = document.getElementById('transaction-date');
  if (el) el.value = formattedDate;
}

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
  const filtered = getFilteredTransactions();
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const inc = document.getElementById('total-income-value');
  const exp = document.getElementById('total-expense-value');
  if (inc) inc.textContent = formatCurrency(totalIncome);
  if (exp) exp.textContent = formatCurrency(totalExpense);
}

export function renderExpensesChart() {
  const expenses = appState.transactions.filter(transaction => transaction.type === 'expense');
  const container = document.querySelector('.chart-container');
  let canvas = document.getElementById('expenses-chart');
  if (expenses.length === 0) {
    if (window.expensesChart) { window.expensesChart.destroy(); window.expensesChart = null; }
    if (container) { container.innerHTML = 'Sem despesas registradas'; }
    return;
  }
  if (!container) return;
  if (!canvas) {
    container.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.id = 'expenses-chart';
    container.appendChild(canvas);
  }
  const expensesByCategory = {};
  expenses.forEach(expense => { expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount; });
  const categories = Object.keys(expensesByCategory);
  const values = Object.values(expensesByCategory);
  const labels = categories.map(category => CATEGORY_LABEL_PT[category] || category);
  const userKey = appState.currentUser || 'default';
  const stored = getChartColors(userKey);
  const colors = [];
  categories.forEach((cat) => {
    let color = stored[cat];
    if (!color) {
      const used = Object.values(stored);
      color = generateRandomColor(used, stored.__last || null);
      stored[cat] = color;
      stored.__last = color;
    }
    colors.push(color);
  });
  setChartColors(userKey, stored);
  if (window.expensesChart) { window.expensesChart.destroy(); window.expensesChart = null; }
  const ctx = canvas.getContext('2d');
  window.expensesChart = new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
}

export function updateUI() {
  renderAccounts();
  renderTransactions();
  populateSidebarAccountFilter();
  updateSummaryCards();
  renderExpensesChart();
  updateWidgetsVisibility();
}

export function updateWidgetsVisibility() {
  const hideTips = localStorage.getItem('hide_tips') === 'true';
  const hideExchange = localStorage.getItem('hide_exchange') === 'true';
  const tipsCard = document.querySelector('.financial-insight');
  const exchCard = document.querySelector('.exchange-rate');
  if (tipsCard) tipsCard.style.display = hideTips ? 'none' : 'block';
  if (exchCard) exchCard.style.display = hideExchange ? 'none' : 'block';
}

export function openAccountModal(accountId = null) {
  const title = document.getElementById('account-modal-title');
  const form = document.getElementById('account-form');
  const name = document.getElementById('account-name');
  const balance = document.getElementById('account-balance');
  const modal = document.getElementById('account-modal');
  if (title) title.textContent = accountId ? 'Editar Conta' : 'Adicionar Conta';
  if (form) form.reset();
  if (accountId) {
    appState.editingAccountId = accountId;
    const account = appState.accounts.find(account => account.id === accountId);
    if (account) { if (name) name.value = account.name; if (balance) balance.value = account.balance; }
  } else { appState.editingAccountId = null; }
  if (modal) modal.classList.add('active');
}

export function openTransactionModal(type) {
  const typeEl = document.getElementById('transaction-type');
  const title = document.getElementById('transaction-modal-title');
  const form = document.getElementById('transaction-form');
  const categoryGroup = document.getElementById('transaction-category-group');
  const toAccGroup = document.getElementById('transaction-to-account-group');
  const modal = document.getElementById('transaction-modal');
  if (typeEl) typeEl.value = type;
  if (title) {
    if (type === 'income') title.textContent = 'Adicionar Receita';
    else if (type === 'expense') title.textContent = 'Adicionar Despesa';
    else title.textContent = 'Adicionar Transferência';
  }
  if (form) form.reset();
  setCurrentDateInTransactionForm();
  if (type === 'expense') { if (categoryGroup) categoryGroup.classList.remove('hidden'); if (toAccGroup) toAccGroup.classList.add('hidden'); }
  else if (type === 'transfer') { if (categoryGroup) categoryGroup.classList.add('hidden'); if (toAccGroup) toAccGroup.classList.remove('hidden'); }
  else { if (categoryGroup) categoryGroup.classList.add('hidden'); if (toAccGroup) toAccGroup.classList.add('hidden'); }
  populateAccountSelects();
  if (modal) modal.classList.add('active');
}

export function populateAccountSelects() {
  const from = document.getElementById('transaction-account');
  const to = document.getElementById('transaction-to-account');
  if (!from || !to) return;
  from.innerHTML = '';
  to.innerHTML = '';
  appState.accounts.forEach(account => {
    const option1 = document.createElement('option');
    option1.value = account.id;
    option1.textContent = account.name;
    from.appendChild(option1);
    const option2 = document.createElement('option');
    option2.value = account.id;
    option2.textContent = account.name;
    to.appendChild(option2);
  });
}

export function closeAllModals() { document.querySelectorAll('.modal').forEach(modal => { modal.classList.remove('active'); }); }

export async function loadRandomInsight() {
  try {
    const response = await fetch('insights.json');
    if (!response.ok) throw new Error();
    const insights = await response.json();
    let randomInsightText = '';
    if (Array.isArray(insights)) {
      const randomIndex = Math.floor(Math.random() * insights.length);
      const selected = insights[randomIndex];
      randomInsightText = typeof selected === 'string' ? selected : (selected?.pt || '');
    } else {
      const languageInsights = insights?.pt || [];
      const randomIndex = Math.floor(Math.random() * (languageInsights.length || 0));
      randomInsightText = languageInsights?.[randomIndex] || '';
    }
    const el = document.getElementById('insight-content');
    if (el) el.textContent = randomInsightText || TEXT.loading;
  } catch (error) {
    console.error(error);
    const el = document.getElementById('insight-content');
    if (el) el.textContent = TEXT.insightError;
  }
}

export function loadExchangeRate() {
  const el = document.getElementById('exchange-content');
  if (el) el.textContent = TEXT.loading;
  fetch('https://api.exchangerate-api.com/v4/latest/USD')
    .then(response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(data => { appState.currentExchangeRate = data.rates.BRL; const formattedRate = appState.currentExchangeRate.toFixed(2); const e = document.getElementById('exchange-content'); if (e) e.textContent = `USD 1 = BRL ${formattedRate}`; })
    .catch((error) => { console.error(error); const e = document.getElementById('exchange-content'); if (e) e.textContent = TEXT.exchangeError; });
}
