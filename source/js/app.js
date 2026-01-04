/* ==========================================================================
   APLICAÇÃO PRINCIPAL (APP)
   --------------------------------------------------------------------------
   Ponto de entrada do sistema. Orquestra eventos, inicialização e configurações.
   ========================================================================== */

import { appState, TEXT, STORAGE } from './state.js';

import { showToast, stringToHex, parseDateBRToISO } from './utils.js';

import { getUsersDb, setUsersDb, saveAccount, addTransaction } from './storage.js';

import { updateUI, renderTransactions, updateSummaryCards } from './render.js';

import { openAccountModal, openTransactionModal, closeAllModals, updateWidgetsVisibility, setCurrentDateInTransactionForm } from './modals.js';

import { loadRandomInsight, loadExchangeRate } from './services.js';

import { loginUser, registerUser, toggleAuthMode, showAuthScreen, showAppScreen, boot, openForgotUsernameModal, proceedForgotPassword } from './auth.js';

// ==========================================================================
// 1. CACHE DE ELEMENTOS DOM
// ==========================================================================
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
  authThemeToggle: document.getElementById('auth-theme-toggle'),
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

// ==========================================================================
// 2. CONFIGURAÇÕES E TEMA
// ==========================================================================

/**
 * Carrega o tema (Claro/Escuro) salvo no LocalStorage e aplica ao body.
 */
function loadSettings() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) { appState.theme = savedTheme; }
  document.body.setAttribute('data-theme', appState.theme);
  updateThemeToggleIcon();
}

/**
 * Alterna entre os temas Claro e Escuro, salva a preferência e atualiza ícones.
 */
function toggleTheme() {
  appState.theme = appState.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', appState.theme);
  document.body.setAttribute('data-theme', appState.theme);
  updateThemeToggleIcon();
}

/**
 * Atualiza o ícone do botão de tema (Sol/Lua) no Header e na tela de Login.
 */
function updateThemeToggleIcon() {
  const icon = appState.theme === 'light'
    ? '<span class="material-symbols-outlined">dark_mode</span>'
    : '<span class="material-symbols-outlined">light_mode</span>';

  if (elements.themeToggle) elements.themeToggle.innerHTML = icon;
  
  if (elements.authThemeToggle) elements.authThemeToggle.innerHTML = icon;
}

/**
 * Adiciona um listener de scroll para esconder o header automaticamente
 * quando o usuário rola a página para baixo (efeito UX).
 */
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

// ==========================================================================
// 3. LISTENERS DE EVENTOS
// ==========================================================================

/**
 * Configura todos os ouvintes de eventos (Event Listeners) da aplicação.
 * Organizado por responsabilidade para facilitar a leitura.
 */
function setupEventListeners() {
  
  // ==========================================================================
  // 1. BARRA SUPERIOR (HEADER) E SERVIÇOS
  // ==========================================================================
  
  // Alternar Tema (Claro/Escuro)
  if (elements.themeToggle) elements.themeToggle.addEventListener('click', toggleTheme);
  
  // Botões de Recarregar Widgets (Dica e Dólar)
  if (elements.refreshInsight) elements.refreshInsight.addEventListener('click', loadRandomInsight);
  if (elements.refreshExchange) elements.refreshExchange.addEventListener('click', loadExchangeRate);


  // ==========================================================================
  // 2. BOTÕES DE AÇÃO (ADICIONAR)
  // ==========================================================================
  
  // Botão Adicionar Conta
  if (elements.addAccountBtn) elements.addAccountBtn.addEventListener('click', () => openAccountModal());

  // Botão Adicionar Receita (Verifica se existem contas antes)
  if (elements.addIncomeBtn) elements.addIncomeBtn.addEventListener('click', () => {
    if (appState.accounts.length === 0) {
      import('./utils.js').then(({ showConfirmModal }) => {
        showConfirmModal('Nenhuma conta encontrada. Criar uma agora?', () => openAccountModal());
      });
      return;
    }
    openTransactionModal('income');
  });

  // Botão Adicionar Despesa
  if (elements.addExpenseBtn) elements.addExpenseBtn.addEventListener('click', () => {
    if (appState.accounts.length === 0) {
      import('./utils.js').then(({ showConfirmModal }) => {
        showConfirmModal('Nenhuma conta encontrada. Criar uma agora?', () => openAccountModal());
      });
      return;
    }
    openTransactionModal('expense');
  });

  // Botão Adicionar Transferência (Exige pelo menos 2 contas)
  if (elements.addTransferBtn) elements.addTransferBtn.addEventListener('click', () => {
    if (appState.accounts.length < 2) { 
        // Import dinâmico do Toast caso não esteja no escopo, ou use showToast direto se importado
        import('./utils.js').then(({ showToast }) => showToast('Necessário ter 2 contas para transferir.', 'warning'));
        return; 
    }
    openTransactionModal('transfer');
  });


  // ==========================================================================
  // 3. FORMULÁRIOS E MODAIS
  // ==========================================================================
  
  // Envio do formulário de Conta (Salvar)
  if (elements.accountForm) elements.accountForm.addEventListener('submit', handleAccountFormSubmit);
  
  // Envio do formulário de Transação (Salvar)
  if (elements.transactionForm) elements.transactionForm.addEventListener('submit', handleTransactionFormSubmit);

  // Botões de Fechar (X) em todos os modais
  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', closeAllModals);
  });
  
  // Botões "Cancelar" dentro dos formulários
  if (elements.cancelAccountBtn) elements.cancelAccountBtn.addEventListener('click', closeAllModals);
  if (elements.cancelTransactionBtn) elements.cancelTransactionBtn.addEventListener('click', closeAllModals);


  // ==========================================================================
  // 4. BARRA LATERAL (FILTROS) - A LÓGICA PRINCIPAL
  // ==========================================================================

  // --- 4.1. Filtro de Mês (Botão "Atual") ---
  if (elements.filterMonthCurrent) elements.filterMonthCurrent.addEventListener('click', () => {
    appState.activeMonthFilter = 'current';           // Atualiza o dado
    
    // Atualiza o visual (Azul neste, remove do outro)
    elements.filterMonthCurrent.classList.add('active'); 
    if (elements.filterMonthPrev) elements.filterMonthPrev.classList.remove('active');
    
    updateUI(); // Atualiza TUDO (Lista, Cards e Gráficos)
  });

  // --- 4.2. Filtro de Mês (Botão "Anterior") ---
  if (elements.filterMonthPrev) elements.filterMonthPrev.addEventListener('click', () => {
    appState.activeMonthFilter = 'prev';              // Atualiza o dado
    
    // Atualiza o visual (Azul neste, remove do outro)
    elements.filterMonthPrev.classList.add('active');
    if (elements.filterMonthCurrent) elements.filterMonthCurrent.classList.remove('active');
    
    updateUI(); // Atualiza TUDO
  });

  // --- 4.3. Filtro de Conta (Dropdown) ---
  if (elements.sidebarAccountFilter) elements.sidebarAccountFilter.addEventListener('change', (event) => {
    appState.activeAccountFilter = event.target.value;
    updateUI();
  });

  // --- 4.4. Busca por Texto (Input) ---
  const searchInput = document.getElementById('filter-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.filterTerm = e.target.value;
      renderTransactions(); // Atualiza lista
      updateSummaryCards(); // Atualiza cards de total
    });
  }

  // --- 4.5. Checkboxes de Tipo (Receita, Despesa, Transf) ---
  const typeCheckboxes = document.querySelectorAll('input[name="type"]');
  typeCheckboxes.forEach(chk => {
    chk.addEventListener('change', () => {
      // Cria um array apenas com os valores marcados
      appState.filterTypes = Array.from(typeCheckboxes)
        .filter(c => c.checked)
        .map(c => c.value);
      updateUI();
    });
  });

  // --- 4.6. Filtro de Categoria (Dropdown) ---
  const catSelect = document.getElementById('filter-category');
  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      appState.filterCategory = e.target.value;
      updateUI();
    });
  }

  // --- 4.7. Ordenação (Data/Valor) ---
  const sortSelect = document.getElementById('filter-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      appState.filterSort = e.target.value;
      renderTransactions(); // Apenas reordena a lista visualmente
    });
  }

  // --- 4.8. Botão LIMPAR FILTROS (Vassoura) ---
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // 1. Reseta o Estado (Dados)
      appState.filterTerm = '';
      appState.filterCategory = 'all';
      appState.filterSort = 'date-desc';
      appState.filterTypes = ['income', 'expense', 'transfer'];
      appState.activeAccountFilter = 'all';
      appState.activeMonthFilter = 'current'; // Volta para mês atual

      // 2. Reseta o Visual (Inputs HTML)
      if (searchInput) searchInput.value = '';
      if (catSelect) catSelect.value = 'all';
      if (sortSelect) sortSelect.value = 'date-desc';
      typeCheckboxes.forEach(c => c.checked = true);
      if(elements.sidebarAccountFilter) elements.sidebarAccountFilter.value = 'all';

      // 3. Reseta os Botões de Mês (Visual Azul)
      if (elements.filterMonthCurrent) elements.filterMonthCurrent.classList.add('active');
      if (elements.filterMonthPrev) elements.filterMonthPrev.classList.remove('active');

      // 4. Atualiza a Tela
      updateUI();
    });
  }


  // ==========================================================================
  // 5. AUTENTICAÇÃO (LOGIN/REGISTRO/LOGOUT)
  // ==========================================================================
  
  // Função auxiliar para processar Login/Registro ao apertar Enter
  const handleEnterAuth = () => {
    const u = elements.authUsername ? elements.authUsername.value.trim() : '';
    const p = elements.authPassword ? elements.authPassword.value : '';
    const card = document.getElementById('auth-card');
    const isRegister = card && card.classList.contains('mode-register');
    if (isRegister) { registerUser(u, p); } else { loginUser(u, p); }
  };
  
  // Listeners de Teclado (Enter) nos inputs de auth
  if (elements.authUsername) elements.authUsername.addEventListener('keydown', (e) => { if (e.key === 'Enter') { handleEnterAuth(); } });
  if (elements.authPassword) elements.authPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') { handleEnterAuth(); } });

  // Botões de Login e Registro
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
  
  // Alternar entre tela de Login e Registro
  if (elements.authToggleLink) elements.authToggleLink.addEventListener('click', toggleAuthMode);
  
  // Botão Sair (Logout)
  if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', () => {
    appState.currentUser = null;
    localStorage.removeItem(STORAGE.CURRENT_USER);
    location.reload();
  });
  
  // Alternar tema na tela de login
  if (elements.authThemeToggle) elements.authThemeToggle.addEventListener('click', toggleTheme);


  // ==========================================================================
  // 6. CONFIGURAÇÕES E RECUPERAÇÃO DE SENHA
  // ==========================================================================
  
  // Abrir Modal de Configurações
  if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', () => {
    // Sincroniza os checkboxes com o localStorage antes de abrir
    if (elements.toggleTipsWidget) {
        elements.toggleTipsWidget.checked = localStorage.getItem('hide_tips') !== 'true';
    }
    if (elements.toggleExchangeWidget) {
        elements.toggleExchangeWidget.checked = localStorage.getItem('hide_exchange') !== 'true';
    }
    
    // Abre o modal
    const m = document.getElementById('settings-modal');
    if (m) m.classList.add('active');
  });

  // Salvar Nova Senha (Configurações)
  if (elements.changePasswordBtn) elements.changePasswordBtn.addEventListener('click', () => {
    const pw = elements.newPassword ? elements.newPassword.value.trim() : '';
    // Lógica inline de troca de senha (pode ser refatorada para uma função externa se preferir)
    if (!pw) { 
        import('./utils.js').then(({ showToast }) => showToast('Informe a nova senha.', 'warning')); 
        return; 
    }
    const users = getUsersDb();
    const idx = users.findIndex(u => u.username === appState.currentUser);
    if (idx !== -1) {
      const hex = stringToHex(pw);
      users[idx].password = hex;
      setUsersDb(users);
      import('./utils.js').then(({ showToast }) => showToast('Senha alterada com sucesso.', 'success'));
      const m = document.getElementById('settings-modal');
      if (m) m.classList.remove('active');
      if (elements.newPassword) elements.newPassword.value = '';
    } else {
        import('./utils.js').then(({ showToast }) => showToast('Usuário não encontrado.', 'error'));
    }
  });

  // Toggles de visibilidade dos widgets
  const setupWidgetToggle = (btn, key, checkboxEl) => {
    if (btn) btn.addEventListener('click', () => {
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
  
  // Checkboxes dentro do modal de configurações
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

  // Links de "Esqueci minha senha"
  if (elements.forgotPasswordLink) elements.forgotPasswordLink.addEventListener('click', openForgotUsernameModal);
  if (elements.forgotUsernameNextBtn) elements.forgotUsernameNextBtn.addEventListener('click', () => {
    const u = elements.forgotUsernameInput ? elements.forgotUsernameInput.value.trim() : '';
    if (!u) { 
        import('./utils.js').then(({ showToast }) => showToast('Informe o usuário.', 'warning'));
        return; 
    }
    proceedForgotPassword(u);
  });


  // ==========================================================================
  // 7. EVENTOS GLOBAIS E UTILITÁRIOS
  // ==========================================================================

  // Ouvinte customizado para abrir o Histórico (disparado pelo botão "Ver Mais" no render.js)
  document.addEventListener('render-history', () => {
    import('./render.js').then(({ renderHistoryDrawer }) => {
        renderHistoryDrawer();
    });
  });

  // Tecla ESC para fechar modais
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      import('./modals.js').then(({ closeAllModals }) => closeAllModals());
    }
  });
}

// ==========================================================================
// 4. HANDLERS DE FORMULÁRIO
// ==========================================================================

/**
 * Manipula o envio do formulário de CRIAÇÃO/EDIÇÃO DE CONTA.
 * Valida dados e chama o storage para salvar.
 * @param {Event} event - Evento de submit do formulário.
 */
function handleAccountFormSubmit(event) {
  event.preventDefault();
  const name = (document.getElementById('account-name')?.value || '').trim();
  const balance = parseFloat(document.getElementById('account-balance')?.value || '0') || 0;
  if (!name) { showToast(TEXT.accountNameRequired, 'warning'); return; }
  saveAccount({ name, balance });
  updateUI();
  closeAllModals();
}

/**
 * Manipula o envio do formulário de TRANSAÇÕES.
 * Identifica o tipo (receita/despesa/transf), valida e salva a operação.
 * @param {Event} event - Evento de submit do formulário.
 */
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

// ==========================================================================
// 5. INICIALIZAÇÃO
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
  setupHideOnScrollHeader();
  boot();
});
  