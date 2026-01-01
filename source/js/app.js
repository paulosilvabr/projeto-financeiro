import { appState, TEXT, CATEGORY_LABEL_PT, STORAGE } from './state.js';
import { showToast, formatCurrency, stringToHex, parseDateBRToISO } from './utils.js';
import { getUsersDb, setUsersDb, loadUserData, saveAccounts, saveTransactions, saveAccount, deleteAccount, addTransaction } from './storage.js';
import { updateUI, renderAccounts, renderTransactions, updateSummaryCards, renderExpensesChart, openAccountModal, openTransactionModal, closeAllModals, setCurrentDateInTransactionForm, populateSidebarAccountFilter, loadRandomInsight, loadExchangeRate, updateWidgetsVisibility } from './render.js';
import { loginUser, registerUser, toggleAuthMode, showAuthScreen, showAppScreen, boot, openForgotUsernameModal, proceedForgotPassword } from './auth.js';

const elements = {
  appTitle: document.getElementById('app-title'),
  themeToggle: document.getElementById('theme-toggle'),
  refreshInsight: document.getElementById('refresh-insight'),
  refreshExchange: document.getElementById('refresh-exchange'),
  addAccountBtn: document.getElementById('add-account-btn'),
  addIncomeBtn: document.getElementById('add-income-btn'),
  addExpenseBtn: document.getElementById('add-expense-btn'),
  addTransferBtn: document.getElementById('add-transfer-btn'),
  accountForm: document.getElementById('account-form'),
  transactionForm: document.getElementById('transaction-form'),
  cancelAccountBtn: document.getElementById('cancel-account-btn'),
  cancelTransactionBtn: document.getElementById('cancel-transaction-btn'),
  filterMonthCurrent: document.getElementById('filter-month-current'),
  filterMonthPrev: document.getElementById('filter-month-prev'),
  sidebarAccountFilter: document.getElementById('sidebar-account-filter'),
  headerEl: document.querySelector('header'),
  authUsername: document.getElementById('auth-username'),
  authPassword: document.getElementById('auth-password'),
  authLoginBtn: document.getElementById('auth-login-btn'),
  authRegisterBtn: document.getElementById('auth-register-btn'),
  authToggleLink: document.getElementById('auth-toggle-link'),
  forgotPasswordLink: document.getElementById('forgot-password-link'),
  forgotUsernameNextBtn: document.getElementById('forgot-username-next-btn'),
  forgotUsernameInput: document.getElementById('forgot-username-input'),
  logoutBtn: document.getElementById('logout-btn'),
  settingsBtn: document.getElementById('settings-btn'),
  newPassword: document.getElementById('new-password'),
  changePasswordBtn: document.getElementById('change-password-btn'),
  toggleTipsWidget: document.getElementById('toggle-tips-widget'),
  toggleExchangeWidget: document.getElementById('toggle-exchange-widget'),
  hideInsightBtn: document.getElementById('hide-insight-btn'),
  hideExchangeBtn: document.getElementById('hide-exchange-btn'),
};

function loadSettings() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) { appState.theme = savedTheme; }
  document.body.setAttribute('data-theme', appState.theme);
  updateThemeToggleIcon();
}

function toggleTheme() {
  appState.theme = appState.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', appState.theme);
  document.body.setAttribute('data-theme', appState.theme);
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  if (!elements.themeToggle) return;
  elements.themeToggle.innerHTML = appState.theme === 'light'
    ? '<span class="material-symbols-outlined">dark_mode</span>'
    : '<span class="material-symbols-outlined">light_mode</span>';
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

function setupEventListeners() {
  if (elements.themeToggle) elements.themeToggle.addEventListener('click', toggleTheme);
  if (elements.refreshInsight) elements.refreshInsight.addEventListener('click', loadRandomInsight);
  if (elements.refreshExchange) elements.refreshExchange.addEventListener('click', loadExchangeRate);

  if (elements.addAccountBtn) elements.addAccountBtn.addEventListener('click', () => openAccountModal());
  if (elements.addIncomeBtn) elements.addIncomeBtn.addEventListener('click', () => {
    if (appState.accounts.length === 0) {
      import('./utils.js').then(({ showConfirmModal }) => {
        showConfirmModal('Nenhuma conta encontrada. Criar uma agora?', () => openAccountModal());
      });
      return;
    }
    openTransactionModal('income');
  });
  if (elements.addExpenseBtn) elements.addExpenseBtn.addEventListener('click', () => {
    if (appState.accounts.length === 0) {
      import('./utils.js').then(({ showConfirmModal }) => {
        showConfirmModal('Nenhuma conta encontrada. Criar uma agora?', () => openAccountModal());
      });
      return;
    }
    openTransactionModal('expense');
  });
  if (elements.addTransferBtn) elements.addTransferBtn.addEventListener('click', () => {
    if (appState.accounts.length < 2) { showToast('Necessário ter 2 contas para transferir.', 'warning'); return; }
    openTransactionModal('transfer');
  });

  if (elements.accountForm) elements.accountForm.addEventListener('submit', handleAccountFormSubmit);
  if (elements.transactionForm) elements.transactionForm.addEventListener('submit', handleTransactionFormSubmit);

  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', closeAllModals);
  });
  if (elements.cancelAccountBtn) elements.cancelAccountBtn.addEventListener('click', closeAllModals);
  if (elements.cancelTransactionBtn) elements.cancelTransactionBtn.addEventListener('click', closeAllModals);

  if (elements.filterMonthCurrent) elements.filterMonthCurrent.addEventListener('click', () => {
    appState.activeMonthFilter = 'current';
    elements.filterMonthCurrent.classList.add('active');
    if (elements.filterMonthPrev) elements.filterMonthPrev.classList.remove('active');
    renderTransactions();
    updateSummaryCards();
  });

  if (elements.filterMonthPrev) elements.filterMonthPrev.addEventListener('click', () => {
    appState.activeMonthFilter = 'prev';
    elements.filterMonthPrev.classList.add('active');
    if (elements.filterMonthCurrent) elements.filterMonthCurrent.classList.remove('active');
    renderTransactions();
    updateSummaryCards();
  });

  if (elements.sidebarAccountFilter) elements.sidebarAccountFilter.addEventListener('change', (event) => {
    appState.activeAccountFilter = event.target.value;
    renderTransactions();
    updateSummaryCards();
  });

  const handleEnterAuth = () => {
    const u = elements.authUsername ? elements.authUsername.value.trim() : '';
    const p = elements.authPassword ? elements.authPassword.value : '';
    const card = document.getElementById('auth-card');
    const isRegister = card && card.classList.contains('mode-register');
    if (isRegister) { registerUser(u, p); } else { loginUser(u, p); }
  };
  if (elements.authUsername) elements.authUsername.addEventListener('keydown', (e) => { if (e.key === 'Enter') { handleEnterAuth(); } });
  if (elements.authPassword) elements.authPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') { handleEnterAuth(); } });

  if (elements.authLoginBtn) elements.authLoginBtn.addEventListener('click', () => {
    const username = elements.authUsername.value.trim();
    const password = elements.authPassword.value;
    loginUser(username, password);
  });
  if (elements.authRegisterBtn) elements.authRegisterBtn.addEventListener('click', () => {
    const username = elements.authUsername.value.trim();
    const password = elements.authPassword.value;
    registerUser(username, password);
  });
  if (elements.authToggleLink) elements.authToggleLink.addEventListener('click', toggleAuthMode);

  if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', () => {
    appState.currentUser = null;
    localStorage.removeItem(STORAGE.CURRENT_USER);
    location.reload();
  });

  if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', () => {
    const m = document.getElementById('settings-modal');
    if (m) m.classList.add('active');
  });
  if (elements.changePasswordBtn) elements.changePasswordBtn.addEventListener('click', () => {
    const pw = elements.newPassword ? elements.newPassword.value.trim() : '';
    if (!pw) { showToast('Informe a nova senha.', 'warning'); return; }
    const users = getUsersDb();
    const idx = users.findIndex(u => u.username === appState.currentUser);
    if (idx !== -1) {
      const hex = stringToHex(pw);
      users[idx].password = hex;
      setUsersDb(users);
      showToast('Senha alterada com sucesso.', 'success');
      const m = document.getElementById('settings-modal');
      if (m) m.classList.remove('active');
      if (elements.newPassword) elements.newPassword.value = '';
    } else {
      showToast('Usuário não encontrado.', 'error');
    }
  });

  if (elements.hideInsightBtn) elements.hideInsightBtn.addEventListener('click', () => {
    import('./utils.js').then(({ showConfirmModal }) => {
      showConfirmModal('Deseja ocultar este widget? (Pode reativar nas configurações)', () => {
        localStorage.setItem('hide_tips', 'true');
        updateWidgetsVisibility();
      });
    });
  });
  if (elements.hideExchangeBtn) elements.hideExchangeBtn.addEventListener('click', () => {
    import('./utils.js').then(({ showConfirmModal }) => {
      showConfirmModal('Deseja ocultar este widget? (Pode reativar nas configurações)', () => {
        localStorage.setItem('hide_exchange', 'true');
        updateWidgetsVisibility();
      });
    });
  });
  if (elements.toggleTipsWidget) {
    elements.toggleTipsWidget.checked = localStorage.getItem('hide_tips') !== 'true';
    elements.toggleTipsWidget.addEventListener('change', () => {
      localStorage.setItem('hide_tips', elements.toggleTipsWidget.checked ? 'false' : 'true');
      updateWidgetsVisibility();
    });
  }
  if (elements.toggleExchangeWidget) {
    elements.toggleExchangeWidget.checked = localStorage.getItem('hide_exchange') !== 'true';
    elements.toggleExchangeWidget.addEventListener('change', () => {
      localStorage.setItem('hide_exchange', elements.toggleExchangeWidget.checked ? 'false' : 'true');
      updateWidgetsVisibility();
    });
  }

  if (elements.forgotPasswordLink) elements.forgotPasswordLink.addEventListener('click', openForgotUsernameModal);
  if (elements.forgotUsernameNextBtn) elements.forgotUsernameNextBtn.addEventListener('click', () => {
    const u = elements.forgotUsernameInput ? elements.forgotUsernameInput.value.trim() : '';
    if (!u) { showToast('Informe o usuário.', 'warning'); return; }
    proceedForgotPassword(u);
  });
}

function handleAccountFormSubmit(event) {
  event.preventDefault();
  const name = (document.getElementById('account-name')?.value || '').trim();
  const balance = parseFloat(document.getElementById('account-balance')?.value || '0') || 0;
  if (!name) { showToast(TEXT.accountNameRequired, 'warning'); return; }
  saveAccount({ name, balance });
  updateUI();
  closeAllModals();
}

function handleTransactionFormSubmit(event) {
  event.preventDefault();
  const type = document.getElementById('transaction-type')?.value;
  const description = (document.getElementById('transaction-description')?.value || '').trim();
  const amount = parseFloat(document.getElementById('transaction-amount')?.value || '0') || 0;
  const accountId = document.getElementById('transaction-account')?.value;
  const date = document.getElementById('transaction-date')?.value;
  if (!description) { showToast(TEXT.descriptionRequired, 'warning'); return; }
  if (amount <= 0) { showToast(TEXT.amountPositive, 'warning'); return; }
  if (!accountId) { showToast(TEXT.accountRequired, 'warning'); return; }
  if (!date) { showToast(TEXT.dateRequired, 'warning'); return; }
  const iso = parseDateBRToISO(date);
  if (!iso) { showToast('Informe uma data válida no formato dd/mm/aaaa.', 'warning'); return; }
  const transactionData = { type, description, amount, accountId, date: iso };
  if (type === 'expense') {
    transactionData.category = document.getElementById('transaction-category')?.value || 'outros';
  } else if (type === 'transfer') {
    const toAccountId = document.getElementById('transaction-to-account')?.value;
    if (!toAccountId) { showToast(TEXT.destinationAccountRequired, 'warning'); return; }
    if (toAccountId === accountId) { showToast(TEXT.differentAccountsRequired, 'warning'); return; }
    transactionData.toAccountId = toAccountId;
  } else {
    transactionData.category = 'outros';
  }
  addTransaction(transactionData);
  updateUI();
  closeAllModals();
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
  setupHideOnScrollHeader();
  boot();
});
