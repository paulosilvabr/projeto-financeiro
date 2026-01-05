/* ==========================================================================
   PERSISTÊNCIA DE DADOS (STORAGE.JS)
   --------------------------------------------------------------------------
   Camada de acesso a dados. Gerencia a leitura e escrita no LocalStorage.
   Responsável por manter o 'appState' sincronizado com o 'users_db'.
   ========================================================================== */

import { STORAGE, appState, TEXT } from './state.js';
import { generateId } from './utils.js';

// ==========================================================================
// 1. ACESSO AO BANCO DE DADOS (BAIXO NÍVEL)
// ==========================================================================

/**
 * Recupera o banco de dados completo de usuários do LocalStorage.
 * @returns {Array<Object>} Lista de usuários cadastrados.
 */
export function getUsersDb() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE.USERS_DB)) || [];
    } catch {
        return [];
    }
}

/**
 * Sobrescreve o banco de dados de usuários no LocalStorage.
 * @param {Array<Object>} users - Nova lista de usuários.
 */
export function setUsersDb(users) {
    localStorage.setItem(STORAGE.USERS_DB, JSON.stringify(users));
}

// ==========================================================================
// 2. SINCRONIZAÇÃO (STATE <-> DB)
// ==========================================================================

/**
 * Carrega os dados do usuário atual (logado) para o estado global da aplicação.
 * Deve ser chamado logo após o login ou ao recarregar a página.
 */
export function loadUserData() {
    const users = getUsersDb();
    const user = users.find(u => u.username === appState.currentUser);

    if (user && user.data) {
        appState.accounts = user.data.accounts || [];
        appState.transactions = user.data.transactions || [];
    } else {
        // Fallback seguro se não houver dados
        appState.accounts = [];
        appState.transactions = [];
    }
}

/**
 * Função interna para salvar o estado atual no disco.
 * Localiza o usuário logado no array de usuários e atualiza apenas seus dados.
 */
function persistData() {
    if (!appState.currentUser) return;

    const users = getUsersDb();
    const idx = users.findIndex(u => u.username === appState.currentUser);

    if (idx !== -1) {
        // Garante que a estrutura de dados existe
        users[idx].data = users[idx].data || {};

        // Atualiza contas e transações de uma vez
        users[idx].data.accounts = appState.accounts;
        users[idx].data.transactions = appState.transactions;

        setUsersDb(users);
    }
}

// ==========================================================================
// 3. REGRA DE NEGÓCIO: CONTAS
// ==========================================================================

/**
 * Cria uma nova conta ou atualiza uma existente.
 * Se houver diferença de saldo na edição, gera uma transação de ajuste automaticamente.
 * @param {Object} accountData - Dados da conta { name, balance }.
 */
export function saveAccount(accountData) {
    // --- MODO EDIÇÃO ---
    if (appState.editingAccountId) {
        const account = appState.accounts.find(a => a.id === appState.editingAccountId);

        if (account) {
            const diff = accountData.balance - account.balance;

            // Atualiza propriedades
            account.name = accountData.name;
            account.balance = accountData.balance;

            // Gera registro de ajuste se o saldo mudou manualmente
            if (diff !== 0) {
                appState.transactions.push({
                    id: generateId(),
                    type: diff > 0 ? 'income' : 'expense',
                    description: TEXT.balanceAdjustment,
                    amount: Math.abs(diff),
                    accountId: account.id,
                    date: new Date().toISOString().split('T')[0],
                    category: 'outros'
                });
            }
        }
        appState.editingAccountId = null;

    } else {
        // --- MODO CRIAÇÃO ---
        const newAccount = {
            id: generateId(),
            name: accountData.name,
            balance: accountData.balance
        };
        appState.accounts.push(newAccount);

        // Gera transação de depósito inicial se começar com saldo positivo
        if (newAccount.balance > 0) {
            appState.transactions.push({
                id: generateId(),
                type: 'income',
                description: TEXT.initialDeposit,
                amount: newAccount.balance,
                accountId: newAccount.id,
                date: new Date().toISOString().split('T')[0],
                category: 'outros'
            });
        }
    }

    persistData();
}

/**
 * Exclui uma conta e remove todas as transações associadas (Cascata).
 * @param {string} accountId - ID da conta a ser removida.
 */
export function deleteAccount(accountId) {
    // Filtra transações que NÃO pertencem a esta conta (Origem ou Destino)
    const hasRelated = appState.transactions.some(t => t.accountId === accountId || t.toAccountId === accountId);

    if (hasRelated) {
        appState.transactions = appState.transactions.filter(t => t.accountId !== accountId && t.toAccountId !== accountId);
    }

    // Remove a conta da lista
    appState.accounts = appState.accounts.filter(a => a.id !== accountId);

    persistData();
}

// ==========================================================================
// 4. REGRA DE NEGÓCIO: TRANSAÇÕES
// ==========================================================================

/**
 * Helper interno para atualizar o saldo das contas ao adicionar/remover transações.
 * @param {Object} t - Objeto da transação.
 * @param {number} multiplier - Use 1 para aplicar a transação, -1 para reverter (excluir).
 */
function applyTransactionToBalance(t, multiplier = 1) {
    const accIdx = appState.accounts.findIndex(a => a.id === t.accountId);
    if (accIdx === -1) return;

    const acc = appState.accounts[accIdx];
    const amt = t.amount * multiplier;

    if (t.type === 'income') {
        acc.balance += amt;
    } else if (t.type === 'expense') {
        acc.balance -= amt;
    } else if (t.type === 'transfer') {
        acc.balance -= amt;
        
        // Atualiza conta de destino na transferência
        const destIdx = appState.accounts.findIndex(a => a.id === t.toAccountId);
        if (destIdx !== -1) {
            appState.accounts[destIdx].balance += amt;
        }
    }
}

/**
 * Adiciona uma nova transação e atualiza os saldos envolvidos.
 * @param {Object} data - Dados do formulário { type, description, amount, ... }.
 */
export function addTransaction(data) {
    const newTx = {
        id: generateId(),
        type: data.type,
        description: data.description,
        amount: data.amount,
        accountId: data.accountId,
        date: data.date,
        category: data.category || 'outros',
        // Adiciona toAccountId apenas se existir (transferência)
        ...(data.toAccountId && { toAccountId: data.toAccountId })
    };

    appState.transactions.push(newTx);
    applyTransactionToBalance(newTx, 1); // Aplica efeito no saldo

    persistData();
}

/**
 * Exclui uma transação e reverte seu efeito no saldo das contas.
 * @param {string} transactionId - ID da transação a remover.
 */
export function deleteTransaction(transactionId) {
    const idx = appState.transactions.findIndex(t => t.id === transactionId);
    if (idx === -1) return;

    const tx = appState.transactions[idx];
    applyTransactionToBalance(tx, -1); // Reverte efeito no saldo

    appState.transactions.splice(idx, 1); // Remove do array

    persistData();
}