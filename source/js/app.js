/* ==========================================================================
   APLICAÇÃO PRINCIPAL (APP.JS)
   --------------------------------------------------------------------------
   Ponto de entrada do sistema. Orquestra eventos, inicialização e configurações.
   Conecta a lógica de Auth, Render, Modals e Storage.
   ========================================================================== */

import { appState, TEXT, STORAGE } from './state.js';
import { showToast, stringToHex, parseDateBRToISO } from './utils.js';
import { getUsersDb, setUsersDb, saveAccount, addTransaction } from './storage.js';
import { updateUI, renderTransactions, updateSummaryCards } from './render.js';
import { 
    openAccountModal, 
    openTransactionModal, 
    closeAllModals, 
    updateWidgetsVisibility, 
    setCurrentDateInTransactionForm 
} from './modals.js';
import { loadRandomInsight, loadExchangeRate } from './services.js';
import { 
    loginUser, 
    registerUser, 
    toggleAuthMode, 
    boot, 
    openForgotUsernameModal, 
    proceedForgotPassword 
} from './auth.js';

// ==========================================================================
// 1. CACHE DE ELEMENTOS DOM
// ==========================================================================
const elements = {
  // Layout Geral
  headerEl: document.querySelector('header'),
  appTitle: document.getElementById('app-title'),
  themeToggle: document.getElementById('theme-toggle'),
  logoutBtn: document.getElementById('logout-btn'),
  settingsBtn: document.getElementById('settings-btn'),
  
  // Widgets e Dashboard
  refreshInsight: document.getElementById('refresh-insight'),
  refreshExchange: document.getElementById('refresh-exchange'),
  hideInsightBtn: document.getElementById('hide-insight-btn'),
  hideExchangeBtn: document.getElementById('hide-exchange-btn'),
  
  // Botões de Ação
  addAccountBtn: document.getElementById('add-account-btn'),
  addIncomeBtn: document.getElementById('add-income-btn'),
  addExpenseBtn: document.getElementById('add-expense-btn'),
  addTransferBtn: document.getElementById('add-transfer-btn'),
  
  // Formulários e Modais
  accountForm: document.getElementById('account-form'),
  transactionForm: document.getElementById('transaction-form'),
  cancelAccountBtn: document.getElementById('cancel-account-btn'),
  cancelTransactionBtn: document.getElementById('cancel-transaction-btn'),
  
  // Filtros Sidebar
  filterMonthCurrent: document.getElementById('filter-month-current'),
  filterMonthPrev: document.getElementById('filter-month-prev'),
  sidebarAccountFilter: document.getElementById('sidebar-account-filter'),
  searchInput: document.getElementById('filter-search'),
  catSelect: document.getElementById('filter-category'),
  sortSelect: document.getElementById('filter-sort'),
  clearFiltersBtn: document.getElementById('clear-filters-btn'),
  
  // Auth (Login/Registro)
  authUsername: document.getElementById('auth-username'),
  authPassword: document.getElementById('auth-password'),
  authLoginBtn: document.getElementById('auth-login-btn'),
  authRegisterBtn: document.getElementById('auth-register-btn'),
  authToggleLink: document.getElementById('auth-toggle-link'),
  authThemeToggle: document.getElementById('auth-theme-toggle'),
  forgotPasswordLink: document.getElementById('forgot-password-link'),
  forgotUsernameNextBtn: document.getElementById('forgot-username-next-btn'),
  forgotUsernameInput: document.getElementById('forgot-username-input'),
  
  // Configurações
  newPassword: document.getElementById('new-password'),
  changePasswordBtn: document.getElementById('change-password-btn'),
  toggleTipsWidget: document.getElementById('toggle-tips-widget'),
  toggleExchangeWidget: document.getElementById('toggle-exchange-widget'),
};

// ==========================================================================
// 2. CONFIGURAÇÕES E TEMA
// ==========================================================================

/**
 * Carrega o tema (Claro/Escuro) salvo e aplica ao body.
 */
function loadSettings() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) { appState.theme = savedTheme; }
  document.body.setAttribute('data-theme', appState.theme);
  updateThemeToggleIcon();
}

/**
 * Alterna entre temas e salva preferência.
 */
function toggleTheme() {
  appState.theme = appState.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', appState.theme);
  document.body.setAttribute('data-theme', appState.theme);
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  const icon = appState.theme === 'light'
    ? '<span class="material-symbols-outlined">dark_mode</span>'
    : '<span class="material-symbols-outlined">light_mode</span>';

  if (elements.themeToggle) elements.themeToggle.innerHTML = icon;
  if (elements.authThemeToggle) elements.authThemeToggle.innerHTML = icon;
}

/**
 * Esconde o header ao rolar para baixo (UX mobile).
 */
function setupHideOnScrollHeader() {
  let lastScrollTop = 0;
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    const current = window.pageYOffset || document.documentElement.scrollTop;
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (current > lastScrollTop && current > 50) {
          elements.headerEl?.classList.add('header-hidden');
        } else {
          elements.headerEl?.classList.remove('header-hidden');
        }
        lastScrollTop = current <= 0 ? 0 : current;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ==========================================================================
// 3. GERENCIAMENTO DE EVENTOS
// ==========================================================================

function setupEventListeners() {
  
  // --- 3.1. HEADER E SERVIÇOS ---
  elements.themeToggle?.addEventListener('click', toggleTheme);
  elements.refreshInsight?.addEventListener('click', loadRandomInsight);
  elements.refreshExchange?.addEventListener('click', loadExchangeRate);
  
  // --- 3.2. WIDGETS (OCULTAR) ---
  const setupWidgetToggle = (btn, key, checkboxEl) => {
    btn?.addEventListener('click', () => {
        import('./utils.js').then(({ showConfirmModal }) => {
            showConfirmModal('Ocultar este widget? (Reative em configurações)', () => {
                localStorage.setItem(key, 'true');
                if (checkboxEl) checkboxEl.checked = false;
                updateWidgetsVisibility();
            });
        });
    });
  };
  setupWidgetToggle(elements.hideInsightBtn, 'hide_tips', elements.toggleTipsWidget);
  setupWidgetToggle(elements.hideExchangeBtn, 'hide_exchange', elements.toggleExchangeWidget);

  // --- 3.3. AÇÕES PRINCIPAIS (ADICIONAR) ---
  elements.addAccountBtn?.addEventListener('click', () => openAccountModal());

  const checkAccountsAndOpen = (type) => {
    if (appState.accounts.length === 0) {
      import('./utils.js').then(({ showConfirmModal }) => {
        showConfirmModal('Nenhuma conta encontrada. Criar uma agora?', () => openAccountModal());
      });
    } else {
      openTransactionModal(type);
    }
  };

  elements.addIncomeBtn?.addEventListener('click', () => checkAccountsAndOpen('income'));
  elements.addExpenseBtn?.addEventListener('click', () => checkAccountsAndOpen('expense'));
  
  elements.addTransferBtn?.addEventListener('click', () => {
    if (appState.accounts.length < 2) { 
        showToast('Necessário ter 2 contas para transferir.', 'warning');
        return; 
    }
    openTransactionModal('transfer');
  });

  // --- 3.4. FORMULÁRIOS (SUBMIT E CANCELAR) ---
  elements.accountForm?.addEventListener('submit', handleAccountFormSubmit);
  elements.transactionForm?.addEventListener('submit', handleTransactionFormSubmit);
  elements.cancelAccountBtn?.addEventListener('click', closeAllModals);
  elements.cancelTransactionBtn?.addEventListener('click', closeAllModals);

  // Fechar modais ao clicar no X
  document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeAllModals));
  // Fechar com ESC
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });

  // --- 3.5. FILTROS (BARRA LATERAL) ---
  
  // Mês Atual vs Anterior
  const setMonth = (mode) => {
    appState.activeMonthFilter = mode;
    elements.filterMonthCurrent.classList.toggle('active', mode === 'current');
    elements.filterMonthPrev.classList.toggle('active', mode === 'prev');
    updateUI();
  };
  elements.filterMonthCurrent?.addEventListener('click', () => setMonth('current'));
  elements.filterMonthPrev?.addEventListener('click', () => setMonth('prev'));

  // Conta
  elements.sidebarAccountFilter?.addEventListener('change', (e) => {
    appState.activeAccountFilter = e.target.value;
    updateUI();
  });

  // Busca Texto
  elements.searchInput?.addEventListener('input', (e) => {
    appState.filterTerm = e.target.value;
    renderTransactions(); 
    updateSummaryCards();
  });

  // Categoria
  elements.catSelect?.addEventListener('change', (e) => {
    appState.filterCategory = e.target.value;
    updateUI();
  });

  // Ordenação
  elements.sortSelect?.addEventListener('change', (e) => {
    appState.filterSort = e.target.value;
    renderTransactions();
  });

  // Tipos (Checkboxes)
  const typeCheckboxes = document.querySelectorAll('input[name="type"]');
  typeCheckboxes.forEach(chk => {
    chk.addEventListener('change', () => {
      appState.filterTypes = Array.from(typeCheckboxes).filter(c => c.checked).map(c => c.value);
      updateUI();
    });
  });

  // Limpar Filtros
  elements.clearFiltersBtn?.addEventListener('click', () => {
    appState.filterTerm = '';
    appState.filterCategory = 'all';
    appState.filterSort = 'date-desc';
    appState.filterTypes = ['income', 'expense', 'transfer'];
    appState.activeAccountFilter = 'all';
    appState.activeMonthFilter = 'current';

    // Reset Visual
    if(elements.searchInput) elements.searchInput.value = '';
    if(elements.catSelect) elements.catSelect.value = 'all';
    if(elements.sortSelect) elements.sortSelect.value = 'date-desc';
    typeCheckboxes.forEach(c => c.checked = true);
    if(elements.sidebarAccountFilter) elements.sidebarAccountFilter.value = 'all';
    setMonth('current');
  });

  // --- 3.6. AUTENTICAÇÃO ---
  const handleAuth = (isRegister) => {
    const u = elements.authUsername?.value.trim();
    const p = elements.authPassword?.value;
    if (isRegister) registerUser(u, p); else loginUser(u, p);
  };

  elements.authLoginBtn?.addEventListener('click', () => handleAuth(false));
  elements.authRegisterBtn?.addEventListener('click', () => handleAuth(true));
  elements.authToggleLink?.addEventListener('click', toggleAuthMode);
  elements.authThemeToggle?.addEventListener('click', toggleTheme);
  
  elements.logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE.CURRENT_USER);
    location.reload();
  });

  // Atalho ENTER no login
  [elements.authUsername, elements.authPassword].forEach(el => {
    el?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const isReg = document.getElementById('auth-card').classList.contains('mode-register');
            handleAuth(isReg);
        }
    });
  });

  // --- 3.7. RECUPERAÇÃO DE SENHA E CONFIG ---
  elements.forgotPasswordLink?.addEventListener('click', openForgotUsernameModal);
  
  elements.forgotUsernameNextBtn?.addEventListener('click', () => {
    const u = elements.forgotUsernameInput?.value.trim();
    if (!u) { showToast('Informe o usuário.', 'warning'); return; }
    proceedForgotPassword(u);
  });

  elements.settingsBtn?.addEventListener('click', () => {
    if (elements.toggleTipsWidget) elements.toggleTipsWidget.checked = localStorage.getItem('hide_tips') !== 'true';
    if (elements.toggleExchangeWidget) elements.toggleExchangeWidget.checked = localStorage.getItem('hide_exchange') !== 'true';
    document.getElementById('settings-modal').classList.add('active');
  });

  // Salvar configurações de Widgets
  elements.toggleTipsWidget?.addEventListener('change', (e) => {
      localStorage.setItem('hide_tips', e.target.checked ? 'false' : 'true');
      updateWidgetsVisibility();
  });
  elements.toggleExchangeWidget?.addEventListener('change', (e) => {
      localStorage.setItem('hide_exchange', e.target.checked ? 'false' : 'true');
      updateWidgetsVisibility();
  });

  // Trocar Senha
  elements.changePasswordBtn?.addEventListener('click', () => {
    const pw = elements.newPassword?.value.trim();
    if (!pw) { showToast('Informe a nova senha.', 'warning'); return; }
    
    const users = getUsersDb();
    const idx = users.findIndex(u => u.username === appState.currentUser);
    if (idx !== -1) {
      users[idx].password = stringToHex(pw);
      setUsersDb(users);
      showToast('Senha alterada com sucesso.', 'success');
      document.getElementById('settings-modal').classList.remove('active');
      elements.newPassword.value = '';
    }
  });

  // --- 3.8. EVENTOS CUSTOMIZADOS ---
  document.addEventListener('render-history', () => {
    import('./render.js').then(({ renderHistoryDrawer }) => renderHistoryDrawer());
  });
}

// ==========================================================================
// 4. HANDLERS DE FORMULÁRIO (LOGIC)
// ==========================================================================

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
  const amount = parseFloat(document.getElementById('transaction-amount')?.value || '0');
  const accountId = document.getElementById('transaction-account')?.value;
  const dateStr = document.getElementById('transaction-date')?.value;
  
  // Validações
  if (!description) { showToast(TEXT.descriptionRequired, 'warning'); return; }
  if (amount <= 0) { showToast(TEXT.amountPositive, 'warning'); return; }
  if (!accountId) { showToast(TEXT.accountRequired, 'warning'); return; }
  
  const isoDate = parseDateBRToISO(dateStr);
  if (!isoDate) { showToast('Data inválida (use dd/mm/aaaa).', 'warning'); return; }

  // Monta objeto
  const txData = { type, description, amount, accountId, date: isoDate };
  
  if (type === 'expense') {
    txData.category = document.getElementById('transaction-category')?.value || 'outros';
  } else if (type === 'transfer') {
    const toAccId = document.getElementById('transaction-to-account')?.value;
    if (!toAccId) { showToast(TEXT.destinationAccountRequired, 'warning'); return; }
    if (toAccId === accountId) { showToast(TEXT.differentAccountsRequired, 'warning'); return; }
    txData.toAccountId = toAccId;
    txData.category = 'outros'; // Transferência não tem categoria visual
  } else {
    txData.category = 'outros';
  }

  addTransaction(txData);
  updateUI();
  closeAllModals();
}

// ==========================================================================
// 5. BOOTSTRAP
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
  setupHideOnScrollHeader();
  boot(); // Verifica sessão e inicia
});