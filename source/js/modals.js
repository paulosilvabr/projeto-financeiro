/* ==========================================================================
   MODAIS E INTERFACE FLUTUANTE
   --------------------------------------------------------------------------
   Controla a abertura, fechamento e lógica de formulários dentro de modais.
   ========================================================================== */

import { appState } from './state.js';

// ==========================================================================
// 1. CONTROLE GERAL
// ==========================================================================

/**
 * Fecha todos os modais atualmente abertos na interface.
 * Remove a classe 'active' de todos os elementos com a classe .modal.
 */
export function closeAllModals() { 
    document.querySelectorAll('.modal').forEach(modal => { 
        modal.classList.remove('active'); 
    }); 
}

// ==========================================================================
// 2. MODAL DE CONTA
// ==========================================================================

/**
 * Abre o modal de cadastro de contas.
 * Se um ID for passado, configura o modal para MODO DE EDIÇÃO, preenchendo os dados.
 * @param {string|null} accountId - ID da conta para editar (ou null para criar nova).
 */
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
    if (account) { 
        if (name) name.value = account.name; 
        if (balance) balance.value = account.balance; 
    }
  } else { 
    appState.editingAccountId = null; 
  }
  
  if (modal) modal.classList.add('active');
}

// ==========================================================================
// 3. MODAL DE TRANSAÇÃO
// ==========================================================================

/**
 * Abre o modal de transação e ajusta o formulário de acordo com o tipo.
 * Ex: Se for 'transfer', mostra campo de conta destino; se 'expense', mostra categoria.
 * @param {string} type - Tipo da transação ('income', 'expense', 'transfer').
 */
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
  
  if (type === 'expense') { 
    if (categoryGroup) categoryGroup.classList.remove('hidden'); 
    if (toAccGroup) toAccGroup.classList.add('hidden'); 
  } else if (type === 'transfer') { 
    if (categoryGroup) categoryGroup.classList.add('hidden'); 
    if (toAccGroup) toAccGroup.classList.remove('hidden'); 
  } else { 
    if (categoryGroup) categoryGroup.classList.add('hidden'); 
    if (toAccGroup) toAccGroup.classList.add('hidden'); 
  }
  
  populateAccountSelects();
  if (modal) modal.classList.add('active');
}

/**
 * Preenche dinamicamente os elementos <select> de contas dentro do modal.
 * Garante que o usuário veja suas contas atualizadas nas opções.
 */
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

/**
 * Define a data de hoje como valor padrão no campo de data do formulário.
 */
export function setCurrentDateInTransactionForm() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${day}/${month}/${year}`;
  const el = document.getElementById('transaction-date');
  if (el) el.value = formattedDate;
}

// ==========================================================================
// 4. CONTROLE DE WIDGETS
// ==========================================================================

/**
 * Verifica as preferências do usuário (localStorage) e mostra/esconde
 * os widgets de Dicas Financeiras e Cotação do Dólar.
 */
export function updateWidgetsVisibility() {
  const hideTips = localStorage.getItem('hide_tips') === 'true';
  const hideExchange = localStorage.getItem('hide_exchange') === 'true';
  const tipsCard = document.querySelector('.financial-insight');
  const exchCard = document.querySelector('.exchange-rate');
  if (tipsCard) tipsCard.style.display = hideTips ? 'none' : 'block';
  if (exchCard) exchCard.style.display = hideExchange ? 'none' : 'block';
}