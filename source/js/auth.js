import { STORAGE, appState } from './state.js';
import { showToast } from './utils.js';
import { getUsersDb, setUsersDb, loadUserData } from './storage.js';
import { updateCategoryOptions, updateUI, loadRandomInsight, loadExchangeRate, setCurrentDateInTransactionForm } from './render.js';

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

export function loginUser(username, password) {
  if (!username || !password) return;
  const users = getUsersDb();
  const user = users.find(u => u.username === username && u.password === password);
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
  users.push({ username, password, data: { accounts: [], transactions: [] } });
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
