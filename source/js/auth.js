/* ==========================================================================
   AUTENTICAÇÃO (LOGIN & REGISTRO)
   --------------------------------------------------------------------------
   Gerencia o acesso do usuário, registro e recuperação de credenciais.
   ========================================================================== */

import { STORAGE, appState } from './state.js';
import { showToast, stringToHex, validatePassword } from './utils.js';
import { getUsersDb, setUsersDb, loadUserData } from './storage.js';
import { updateCategoryOptions, updateUI } from './render.js';
import { loadRandomInsight, loadExchangeRate } from './services.js';
import { setCurrentDateInTransactionForm } from './modals.js';

/**
 * Exibe a tela de Login/Cadastro e esconde a aplicação principal.
 * Ajusta o CSS para remover o header global nesta tela.
 */
export function showAuthScreen() {
  const app = document.getElementById('app-screen');
  const header = document.querySelector('header');
  const auth = document.getElementById('auth-screen');
    
  if (app) app.style.display = 'none';
  if (header) header.style.display = 'none'
  if (auth) {
    auth.style.display = 'flex'
    auth.style.top = '0'
    auth.style.height = '100vh'
  }
  
}

/**
 * Exibe o Dashboard principal e esconde a tela de Login.
 * Restaura o header global e atualiza a saudação ao usuário.
 */
export function showAppScreen() {
  const app = document.getElementById('app-screen');
  const header = document.querySelector('header');
  const auth = document.getElementById('auth-screen');
  
  if (app) app.style.display = 'block';
  if (header) header.style.display = 'block';
  if (auth) {
    auth.style.display = 'none'
    auth.style.top = '';
    auth.style.height = '';
  }
  
  const title = document.getElementById('app-title');
  if (title && appState.currentUser) title.textContent = `Olá, ${appState.currentUser}`;
}

/**
 * Alterna o formulário de autenticação entre os modos "Entrar" e "Criar Conta".
 * Limpa os campos de input ao trocar.
 */
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

/**
 * Tenta autenticar o usuário verificando as credenciais no banco de dados local.
 * Se sucesso: Carrega dados e entra no app. Se erro: Mostra toast.
 * @param {string} username - Nome do usuário.
 * @param {string} password - Senha (texto plano, será hashada internamente).
 */
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

/**
 * Registra um novo usuário no sistema.
 * Valida força da senha e duplicidade de usuário antes de salvar.
 * @param {string} username - Nome do usuário.
 * @param {string} password - Senha escolhida.
 */
export function registerUser(username, password) {
  if (!username || !password) return;

  const error = validatePassword(password);
  if (error) {
    showToast(error, 'warning')
    return console.log(error);
  }

  const users = getUsersDb();
  if (users.some(u => u.username === username)) { showToast('Usuário já existe.', 'warning'); return; }
  users.push({ username, password: stringToHex(password), data: { accounts: [], transactions: [] } });
  setUsersDb(users);
  loginUser(username, password);
}

/**
 * Função de Boot (Inicialização).
 * Verifica se existe uma sessão ativa no LocalStorage ao abrir a página.
 * Se sim, loga automaticamente; se não, mostra tela de login.
 */
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
/**
 * Abre o primeiro modal do fluxo de "Esqueci minha senha" (Solicitar usuário).
 */
export function openForgotUsernameModal() {
  const m = document.getElementById('forgot-username-modal');
  if (m) m.classList.add('active');
}

/**
 * Valida se o usuário existe e avança para o segundo modal (Definir nova senha).
 * Configura o evento de salvamento da nova senha.
 * @param {string} username - Nome do usuário a recuperar.
 */
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
