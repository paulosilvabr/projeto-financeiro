/* ==========================================================================
   MODAIS E INTERFACE FLUTUANTE (MODALS.JS)
   --------------------------------------------------------------------------
   Controla a abertura, fechamento e lógica visual dos modais (popups).
   Gerencia o preenchimento inicial de formulários e estados de visibilidade.
   ========================================================================== */

import { appState } from './state.js';
import { formatCurrency } from './utils.js';

// ==========================================================================
// 1. CONTROLE GERAL (ABRIR/FECHAR)
// ==========================================================================

/**
 * Fecha todos os modais ativos na tela.
 * Remove a classe 'active' e restaura o scroll da página principal.
 */
export function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = ''; // Destrava o scroll
}

// ==========================================================================
// 2. MODAL DE CONTA (CRIAR/EDITAR)
// ==========================================================================

/**
 * Abre o modal de cadastro de contas.
 * Suporta dois modos: Criação (vazio) e Edição (preenchido).
 * @param {string|null} accountId - ID da conta para editar (ou null para criar).
 */
export function openAccountModal(accountId = null) {
    const modal = document.getElementById('account-modal');
    const title = document.getElementById('account-modal-title');
    const form = document.getElementById('account-form');
    const nameInput = document.getElementById('account-name');
    const balanceInput = document.getElementById('account-balance');

    if (!modal) return;

    // Configura textos
    if (title) title.textContent = accountId ? 'Editar Conta' : 'Adicionar Conta';
    
    // Reseta o formulário para evitar dados antigos
    if (form) form.reset();

    if (accountId) {
        // --- MODO EDIÇÃO ---
        appState.editingAccountId = accountId;
        const account = appState.accounts.find(acc => acc.id === accountId);

        if (account) {
            if (nameInput) nameInput.value = account.name;
            
            // Formata o valor existente (ex: R$ 1.000,00) para exibição correta com a máscara
            if (balanceInput) {
                balanceInput.value = formatCurrency(account.balance);
            }
        }
    } else {
        // --- MODO CRIAÇÃO ---
        appState.editingAccountId = null;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Trava scroll do fundo
}

// ==========================================================================
// 3. MODAL DE TRANSAÇÃO (RECEITA/DESPESA/TRANSFERÊNCIA)
// ==========================================================================

/**
 * Abre o modal de transação configurado para o tipo específico.
 * Gerencia a visibilidade de campos (ex: Categoria vs Conta Destino).
 * @param {'income'|'expense'|'transfer'} type - Tipo da transação.
 */
export function openTransactionModal(type) {
    const modal = document.getElementById('transaction-modal');
    if (!modal) return;

    const title = document.getElementById('transaction-modal-title');
    const typeInput = document.getElementById('transaction-type');
    const form = document.getElementById('transaction-form');

    // Grupos de campos dinâmicos
    const categoryGroup = document.getElementById('transaction-category-group');
    const toAccGroup = document.getElementById('transaction-to-account-group');

    // 1. Define o Tipo (Input Oculto)
    if (typeInput) typeInput.value = type;

    // 2. Define o Título do Modal
    if (title) {
        const titles = {
            'income': 'Adicionar Receita',
            'expense': 'Adicionar Despesa',
            'transfer': 'Adicionar Transferência'
        };
        title.textContent = titles[type] || 'Nova Transação';
    }

    // 3. Reseta formulário e define Data Hoje
    if (form) form.reset();
    setCurrentDateInTransactionForm();

    // 4. Lógica de Campos Visíveis
    if (categoryGroup && toAccGroup) {
        if (type === 'expense') {
            categoryGroup.classList.remove('hidden'); // Mostra Categoria
            toAccGroup.classList.add('hidden');       // Esconde Destino
        } else if (type === 'transfer') {
            categoryGroup.classList.add('hidden');    // Esconde Categoria
            toAccGroup.classList.remove('hidden');    // Mostra Destino
        } else {
            // Income
            categoryGroup.classList.add('hidden');
            toAccGroup.classList.add('hidden');
        }
    }

    // 5. Atualiza as opções dos selects de conta
    populateAccountSelects();

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Preenche os selects de "Conta" e "Conta Destino" com as contas atuais do usuário.
 * Chamado sempre que o modal de transação é aberto.
 */
export function populateAccountSelects() {
    const fromSelect = document.getElementById('transaction-account');
    const toSelect = document.getElementById('transaction-to-account');

    // Helper para criar as opções do DOM
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
 * Define a data atual no input de data do formulário de transação.
 * Formato: dd/mm/aaaa (Padrão BR para o input com máscara/texto).
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
// 4. MODAIS AUXILIARES
// ==========================================================================

/**
 * Abre a gaveta lateral de Histórico Completo.
 * Dispara um evento personalizado para notificar o renderizador.
 */
export function openHistoryModal() {
    const modal = document.getElementById('history-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Notifica render.js para desenhar a lista completa dentro do modal
        document.dispatchEvent(new CustomEvent('render-history'));
    }
}

/**
 * Atualiza a visibilidade dos Widgets (Dicas e Cotação) com base no LocalStorage.
 * Chamado ao carregar a página ou alterar configurações.
 */
export function updateWidgetsVisibility() {
    const hideTips = localStorage.getItem('hide_tips') === 'true';
    const hideExchange = localStorage.getItem('hide_exchange') === 'true';

    const tipsCard = document.querySelector('.financial-insight');
    const exchCard = document.querySelector('.exchange-rate');

    if (tipsCard) tipsCard.style.display = hideTips ? 'none' : 'block';
    if (exchCard) exchCard.style.display = hideExchange ? 'none' : 'block';
}