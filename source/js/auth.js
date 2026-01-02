/* ==========================================================================
   AUTENTICAÇÃO (LOGIN & REGISTRO)
   --------------------------------------------------------------------------
   Gerencia o acesso do usuário, registro e recuperação de credenciais.
   ========================================================================== */

import { STORAGE, appState } from './state.js';
import { showToast, stringToHex } from './utils.js';
import { getUsersDb, setUsersDb, loadUserData } from './storage.js';
import { updateCategoryOptions, updateUI } from './render.js';
import { loadRandomInsight, loadExchangeRate } from './services.js';
import { setCurrentDateInTransactionForm } from './modals.js';

// ==========================================================================
// 1. CONTROLE DE TELAS (AUTH VS APP)
// ==========================================================================
export function showAuthScreen() {
  const auth = document.getElementById('auth-screen');
  const app = document.getElementById('app-screen');
  if (app) app.style.display = 'none';
  if (auth) auth.style.display = 'flex';
}

export function showAppScreen() {
  const auth = document.getElementById('auth-screen');
  const app = document.getElementById('app-screen');
  if (auth) auth.style.display = 'none';
  if (app) app.style.display = 'block';
  const title = document.getElementById('app-title');
  if (title && appState.currentUser) title.textContent = `Olá, ${appState.currentUser}`;
}

export function toggleAuthMode() {
  const card = document.getElementById('auth-card');
  const titleEl = document.getElementById('auth-title');
  const loginBtn = document.getElementById('auth-login-btn');
  const registerBtn = document.getElementById('auth-register-btn');
  const toggleLink = document.getElementById('auth-toggle-link');
  const username = document.getElementById('auth-username');
  const password = document.getElementById('auth-password');
  if (!card || !titleEl || !loginBtn || !registerBtn || !toggleLink) return;
  const isRegister = card.classList.toggle('mode-register');
  if (isRegister) {
    titleEl.textContent = 'Criar Conta';
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'inline-flex';
    toggleLink.textContent = 'Já tem conta? Entrar';
  } else {
    titleEl.textContent = 'Entrar';
    loginBtn.style.display = 'inline-flex';
    registerBtn.style.display = 'none';
    toggleLink.textContent = 'Não tem conta? Criar agora';
  }
  if (username) username.value = '';
  if (password) password.value = '';
}

// ==========================================================================
// 2. LÓGICA DE LOGIN E REGISTRO
// ==========================================================================
export function loginUser(username, password) {
  if (!username || !password) return;
  const users = getUsersDb();
  const user = users.find(u => u.username === username && u.password === stringToHex(password));
  if (user) {
    appState.currentUser = username;
    localStorage.setItem(STORAGE.CURRENT_USER, username);
    loadUserData();
    showAppScreen();
    updateCategoryOptions();
    updateUI();
    loadRandomInsight();
    loadExchangeRate();
    setCurrentDateInTransactionForm();
  } else {
    showToast('Usuário ou senha inválidos.', 'error');
  }
}

export function registerUser(username, password) {
  if (!username || !password) return;
  const users = getUsersDb();
  if (users.some(u => u.username === username)) { showToast('Usuário já existe.', 'warning'); return; }
  users.push({ username, password: stringToHex(password), data: { accounts: [], transactions: [] } });
  setUsersDb(users);
  loginUser(username, password);
}

export function boot() {
  const storedUser = localStorage.getItem(STORAGE.CURRENT_USER);
  if (storedUser) {
    appState.currentUser = storedUser;
    loadUserData();
    showAppScreen();
    updateCategoryOptions();
    updateUI();
    loadRandomInsight();
    loadExchangeRate();
    setCurrentDateInTransactionForm();
  } else {
    showAuthScreen();
  }
}

// ==========================================================================
// 3. RECUPERAÇÃO DE SENHA
// ==========================================================================
export function openForgotUsernameModal() {
  const m = document.getElementById('forgot-username-modal');
  if (m) m.classList.add('active');
}

export function proceedForgotPassword(username) {
  const users = getUsersDb();
  const user = users.find(u => u.username === username);
  if (!user) { showToast('Usuário não encontrado.', 'error'); return; }
  const m1 = document.getElementById('forgot-username-modal');
  const m2 = document.getElementById('forgot-new-password-modal');
  if (m1) m1.classList.remove('active');
  if (m2) m2.classList.add('active');
  const saveBtn = document.getElementById('forgot-new-password-save-btn');
  const input = document.getElementById('forgot-new-password-input');
  if (saveBtn && input) {
    saveBtn.onclick = () => {
      const pw = input.value.trim();
      if (!pw) { showToast('Informe a nova senha.', 'warning'); return; }
      const idx = users.findIndex(u => u.username === username);
      if (idx !== -1) {
        users[idx].password = stringToHex(pw);
        setUsersDb(users);
        appState.currentUser = username;
        localStorage.setItem(STORAGE.CURRENT_USER, username);
        loadUserData();
        showAppScreen();
        updateCategoryOptions();
        updateUI();
        loadRandomInsight();
        loadExchangeRate();
        setCurrentDateInTransactionForm();
        const m2c = document.getElementById('forgot-new-password-modal');
        if (m2c) m2c.classList.remove('active');
        input.value = '';
        showToast('Senha redefinida.', 'success');
      }
    };
  }
}