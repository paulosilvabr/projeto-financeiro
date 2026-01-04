/* ==========================================================================
   PERSISTÊNCIA DE DADOS (STORAGE.JS)
   --------------------------------------------------------------------------
   Gerencia a comunicação com o LocalStorage.
   Otimizado para reduzir leituras/escritas repetitivas.
   ========================================================================== */

import { STORAGE, appState, TEXT } from './state.js';
import { generateId } from './utils.js';

// ==========================================================================
// 1. ACESSO AO BANCO DE DADOS (BAIXO NÍVEL)
// ==========================================================================

export function getUsersDb() {
  try { 
    return JSON.parse(localStorage.getItem(STORAGE.USERS_DB)) || []; 
  } catch { 
    return []; 
  }
}

export function setUsersDb(users) {
  localStorage.setItem(STORAGE.USERS_DB, JSON.stringify(users));
}

// ==========================================================================
// 2. CARREGAMENTO E SALVAMENTO (SYNC STATE <-> DB)
// ==========================================================================

/**
 * Carrega os dados do usuário logado para o appState.
 */
export function loadUserData() {
  const users = getUsersDb();
  const user = users.find(u => u.username === appState.currentUser);
  
  if (user && user.data) {
    appState.accounts = user.data.accounts || [];
    appState.transactions = user.data.transactions || [];
  } else {
    appState.accounts = [];
    appState.transactions = [];
  }
}

/**
 * Persiste O ESTADO ATUAL (Contas e Transações) no LocalStorage.
 * Substitui saveAccounts e saveTransactions individuais para evitar duplo I/O.
 */
function persistData() {
  if (!appState.currentUser) return;

  const users = getUsersDb();
  const idx = users.findIndex(u => u.username === appState.currentUser);

  if (idx !== -1) {
    // Garante que a estrutura de dados existe
    users[idx].data = users[idx].data || {};
    
    // Atualiza ambos de uma vez
    users[idx].data.accounts = appState.accounts;
    users[idx].data.transactions = appState.transactions;
    
    setUsersDb(users);
  }
}

// ==========================================================================
// 3. LÓGICA DE NEGÓCIO (CONTAS)
// ==========================================================================

/**
 * Cria ou Edita uma conta.
 * Gerencia transações automáticas de ajuste de saldo ou depósito inicial.
 */
export function saveAccount(accountData) {
  // --- MODO EDIÇÃO ---
  if (appState.editingAccountId) {
    const account = appState.accounts.find(a => a.id === appState.editingAccountId);
    
    if (account) {
      const diff = accountData.balance - account.balance;
      
      // Atualiza dados da conta
      account.name = accountData.name;
      account.balance = accountData.balance;

      // Se o saldo mudou manualmente, cria registro
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

    // Depósito inicial se começar com dinheiro
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

  persistData(); // Salva tudo de uma vez
}

export function deleteAccount(accountId) {
  // Remove transações órfãs (Cascata)
  const hasRelated = appState.transactions.some(t => t.accountId === accountId || t.toAccountId === accountId);
  
  if (hasRelated) {
    appState.transactions = appState.transactions.filter(t => t.accountId !== accountId && t.toAccountId !== accountId);
  }
  
  // Remove a conta
  appState.accounts = appState.accounts.filter(a => a.id !== accountId);
  
  persistData();
}

// ==========================================================================
// 4. LÓGICA DE NEGÓCIO (TRANSAÇÕES)
// ==========================================================================

/**
 * Helper para atualizar saldo.
 * @param {Object} t - Transação
 * @param {number} multiplier - 1 para adicionar, -1 para reverter (deletar)
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
    // Atualiza destino
    const destIdx = appState.accounts.findIndex(a => a.id === t.toAccountId);
    if (destIdx !== -1) {
      appState.accounts[destIdx].balance += amt;
    }
  }
}

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
  applyTransactionToBalance(newTx, 1); // Aplica saldo
  
  persistData();
}

export function deleteTransaction(transactionId) {
  const idx = appState.transactions.findIndex(t => t.id === transactionId);
  if (idx === -1) return;

  const tx = appState.transactions[idx];
  applyTransactionToBalance(tx, -1); // Reverte saldo (-1)
  
  appState.transactions.splice(idx, 1);
  
  persistData();
}