/* ==========================================================================
   MODAIS E INTERFACE FLUTUANTE (MODALS.JS)
   --------------------------------------------------------------------------
   Controla a abertura, fechamento e lógica de formulários dentro de modais.
   Otimizado para manipulação direta do DOM e gestão de estado visual.
   ========================================================================== */

import { appState } from './state.js';

// ==========================================================================
// 1. CONTROLE GERAL (ABRIR/FECHAR)
// ==========================================================================

/**
 * Fecha todos os modais atualmente abertos na interface.
 * Remove a classe 'active' e destrava o scroll do corpo da página.
 */
export function closeAllModals() { 
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => { 
        modal.classList.remove('active'); 
    });
    document.body.style.overflow = ''; // Restaura o scroll da página
}

// ==========================================================================
// 2. MODAL DE CONTA (CRIAR/EDITAR)
// ==========================================================================

/**
 * Abre o modal de cadastro de contas.
 * Se um ID for passado, configura o modal para MODO DE EDIÇÃO, preenchendo os dados.
 * @param {string|null} accountId - ID da conta para editar (ou null para criar nova).
 */
export function openAccountModal(accountId = null) {
  const modal = document.getElementById('account-modal');
  const title = document.getElementById('account-modal-title');
  const form = document.getElementById('account-form');
  const nameInput = document.getElementById('account-name');
  const balanceInput = document.getElementById('account-balance');
  
  if (!modal) return;

  // Configura textos e estado
  if (title) title.textContent = accountId ? 'Editar Conta' : 'Adicionar Conta';
  if (form) form.reset();
  
  if (accountId) {
    // MODO EDIÇÃO: Preenche os campos com dados existentes
    appState.editingAccountId = accountId;
    const account = appState.accounts.find(acc => acc.id === accountId);
    
    if (account) { 
        if (nameInput) nameInput.value = account.name; 
        if (balanceInput) balanceInput.value = account.balance; 
    }
  } else { 
    // MODO CRIAÇÃO
    appState.editingAccountId = null; 
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Trava scroll do fundo
}

// ==========================================================================
// 3. MODAL DE TRANSAÇÃO (RECEITA/DESPESA/TRANSFERÊNCIA)
// ==========================================================================

/**
 * Abre o modal de transação e ajusta o formulário de acordo com o tipo.
 * Gerencia a visibilidade dos campos (ex: Categoria vs Conta Destino).
 * @param {string} type - Tipo da transação ('income', 'expense', 'transfer').
 */
export function openTransactionModal(type) {
  const modal = document.getElementById('transaction-modal');
  if (!modal) return;

  const title = document.getElementById('transaction-modal-title');
  const typeInput = document.getElementById('transaction-type');
  const form = document.getElementById('transaction-form');
  
  // Grupos de campos que aparecem/somem dinamicamente
  const categoryGroup = document.getElementById('transaction-category-group');
  const toAccGroup = document.getElementById('transaction-to-account-group');
  
  // 1. Configura Tipo e Título
  if (typeInput) typeInput.value = type;
  
  if (title) {
    const titles = {
        'income': 'Adicionar Receita',
        'expense': 'Adicionar Despesa',
        'transfer': 'Adicionar Transferência'
    };
    title.textContent = titles[type] || 'Nova Transação';
  }
  
  // 2. Reseta o formulário e define a data de hoje
  if (form) form.reset();
  setCurrentDateInTransactionForm();
  
  // 3. Lógica de Exibição de Campos (Toggle Visibility)
  if (categoryGroup && toAccGroup) {
      if (type === 'expense') {
          // Despesa: Mostra Categoria, Esconde Destino
          categoryGroup.classList.remove('hidden');
          toAccGroup.classList.add('hidden');
      } else if (type === 'transfer') {
          // Transferência: Esconde Categoria, Mostra Destino
          categoryGroup.classList.add('hidden');
          toAccGroup.classList.remove('hidden');
      } else {
          // Receita: Esconde ambos (geralmente receita não tem categoria detalhada no seu app)
          categoryGroup.classList.add('hidden');
          toAccGroup.classList.add('hidden');
      }
  }
  
  // 4. Atualiza os selects de conta com dados recentes
  populateAccountSelects();
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Preenche dinamicamente os elementos <select> de contas dentro do modal.
 * Garante que o usuário veja suas contas atualizadas nas opções de origem/destino.
 */
export function populateAccountSelects() {
  const fromSelect = document.getElementById('transaction-account');
  const toSelect = document.getElementById('transaction-to-account');
  
  // Função helper para criar options
  const createOptions = () => {
      return appState.accounts.map(account => {
          const opt = document.createElement('option');
          opt.value = account.id;
          opt.textContent = account.name;
          return opt;
      });
  };

  if (fromSelect) {
      fromSelect.innerHTML = '';
      createOptions().forEach(opt => fromSelect.appendChild(opt));
  }

  if (toSelect) {
      toSelect.innerHTML = '';
      createOptions().forEach(opt => toSelect.appendChild(opt));
  }
}

/**
 * Define a data de hoje como valor padrão no campo de data do formulário.
 * Formato: dd/mm/aaaa
 */
export function setCurrentDateInTransactionForm() {
  const dateInput = document.getElementById('transaction-date');
  if (!dateInput) return;

  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  
  dateInput.value = `${day}/${month}/${year}`;
}

// ==========================================================================
// 4. OUTROS MODAIS (HISTÓRICO E CONFIGURAÇÕES)
// ==========================================================================

/**
 * Abre a gaveta lateral de histórico e dispara evento para renderizar.
 */
export function openHistoryModal() {
  const modal = document.getElementById('history-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Dispara evento para que render.js saiba que precisa desenhar a lista completa
    document.dispatchEvent(new CustomEvent('render-history'));
  }
}

// ==========================================================================
// 5. WIDGETS (DICAS E DÓLAR)
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