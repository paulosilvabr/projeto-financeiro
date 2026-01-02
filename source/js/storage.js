/* ==========================================================================
   PERSISTÊNCIA DE DADOS (STORAGE)
   --------------------------------------------------------------------------
   Gerencia toda a comunicação com o LocalStorage (Salvar, Carregar, Atualizar).
   ========================================================================== */

import { STORAGE, appState, TEXT } from './state.js';
import { generateId } from './utils.js';

// ==========================================================================
// 1. ACESSO AO BANCO DE DADOS (LOCALSTORAGE)
// ==========================================================================
export function getUsersDb() {
  try { return JSON.parse(localStorage.getItem(STORAGE.USERS_DB)) || []; } catch { return []; }
}

export function setUsersDb(users) {
  localStorage.setItem(STORAGE.USERS_DB, JSON.stringify(users));
}

// ==========================================================================
// 2. CARREGAMENTO DE DADOS DO USUÁRIO
// ==========================================================================
export function loadUserData() {
  const users = getUsersDb();
  const idx = users.findIndex(u => u.username === appState.currentUser);
  if (idx !== -1) {
    const data = users[idx].data || { accounts: [], transactions: [] };
    appState.accounts = data.accounts || [];
    appState.transactions = data.transactions || [];
  } else {
    appState.accounts = [];
    appState.transactions = [];
  }
}

// ==========================================================================
// 3. SALVAMENTO DE ENTIDADES
// ==========================================================================
export function saveAccounts() {
  const users = getUsersDb();
  const idx = users.findIndex(u => u.username === appState.currentUser);
  if (idx !== -1) {
    users[idx].data = users[idx].data || { accounts: [], transactions: [] };
    users[idx].data.accounts = appState.accounts;
    setUsersDb(users);
  }
}

export function saveTransactions() {
  const users = getUsersDb();
  const idx = users.findIndex(u => u.username === appState.currentUser);
  if (idx !== -1) {
    users[idx].data = users[idx].data || { accounts: [], transactions: [] };
    users[idx].data.transactions = appState.transactions;
    setUsersDb(users);
  }
}

// ==========================================================================
// 4. LÓGICA DE SALDO (ATUALIZAÇÃO)
// ==========================================================================
function updateAccountBalances(transaction) {
  const accountIndex = appState.accounts.findIndex(account => account.id === transaction.accountId);
  if (accountIndex !== -1) {
    if (transaction.type === 'income') {
      appState.accounts[accountIndex].balance += transaction.amount;
    } else if (transaction.type === 'expense') {
      appState.accounts[accountIndex].balance -= transaction.amount;
    } else if (transaction.type === 'transfer') {
      appState.accounts[accountIndex].balance -= transaction.amount;
      const toAccountIndex = appState.accounts.findIndex(account => account.id === transaction.toAccountId);
      if (toAccountIndex !== -1) {
        appState.accounts[toAccountIndex].balance += transaction.amount;
      }
    }
  }
}

function updateAccountBalancesReverse(transaction) {
  const accountIndex = appState.accounts.findIndex(account => account.id === transaction.accountId);
  if (accountIndex !== -1) {
    if (transaction.type === 'income') {
      appState.accounts[accountIndex].balance -= transaction.amount;
    } else if (transaction.type === 'expense') {
      appState.accounts[accountIndex].balance += transaction.amount;
    } else if (transaction.type === 'transfer') {
      appState.accounts[accountIndex].balance += transaction.amount;
      const toAccountIndex = appState.accounts.findIndex(account => account.id === transaction.toAccountId);
      if (toAccountIndex !== -1) {
        appState.accounts[toAccountIndex].balance -= transaction.amount;
      }
    }
  }
}

// ==========================================================================
// 5. OPERAÇÕES PÚBLICAS (ADD/DELETE/SAVE)
// ==========================================================================
export function saveAccount(accountData) {
  if (appState.editingAccountId) {
    const accountIndex = appState.accounts.findIndex(account => account.id === appState.editingAccountId);
    if (accountIndex !== -1) {
      const balanceDifference = accountData.balance - appState.accounts[accountIndex].balance;
      appState.accounts[accountIndex].name = accountData.name;
      appState.accounts[accountIndex].balance = accountData.balance;
      if (balanceDifference !== 0) {
        const adjustmentTransaction = {
          id: generateId(),
          type: balanceDifference > 0 ? 'income' : 'expense',
          description: TEXT.balanceAdjustment,
          amount: Math.abs(balanceDifference),
          accountId: appState.editingAccountId,
          date: new Date().toISOString().split('T')[0],
          category: 'outros'
        };
        appState.transactions.push(adjustmentTransaction);
        saveTransactions();
      }
    }
    appState.editingAccountId = null;
  } else {
    const newAccount = { id: generateId(), name: accountData.name, balance: accountData.balance };
    appState.accounts.push(newAccount);
    if (newAccount.balance > 0) {
      const initialDepositTransaction = {
        id: generateId(),
        type: 'income',
        description: TEXT.initialDeposit,
        amount: newAccount.balance,
        accountId: newAccount.id,
        date: new Date().toISOString().split('T')[0],
        category: 'outros'
      };
      appState.transactions.push(initialDepositTransaction);
      saveTransactions();
    }
  }
  saveAccounts();
}

export function deleteAccount(accountId) {
  const hasTransactions = appState.transactions.some(transaction => transaction.accountId === accountId || transaction.toAccountId === accountId);
  if (hasTransactions) {
    appState.transactions = appState.transactions.filter(transaction => transaction.accountId !== accountId && transaction.toAccountId !== accountId);
    saveTransactions();
  }
  appState.accounts = appState.accounts.filter(account => account.id !== accountId);
  saveAccounts();
}

export function addTransaction(transactionData) {
  const newTransaction = {
    id: generateId(),
    type: transactionData.type,
    description: transactionData.description,
    amount: transactionData.amount,
    accountId: transactionData.accountId,
    date: transactionData.date,
    category: transactionData.category
  };
  if (transactionData.type === 'transfer') {
    newTransaction.toAccountId = transactionData.toAccountId;
  }
  appState.transactions.push(newTransaction);
  updateAccountBalances(newTransaction);
  saveTransactions();
  saveAccounts();
}

export function deleteTransaction(transactionId) {
  const idx = appState.transactions.findIndex(t => t.id === transactionId);
  if (idx === -1) return;
  const trx = appState.transactions[idx];
  updateAccountBalancesReverse(trx);
  appState.transactions.splice(idx, 1);
  saveTransactions();
  saveAccounts();
}