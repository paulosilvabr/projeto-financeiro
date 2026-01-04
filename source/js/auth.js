/* ==========================================================================
   AUTENTICAÇÃO E SESSÃO (AUTH.JS)
   --------------------------------------------------------------------------
   Gerencia login, registro, recuperação de senha e inicialização (boot).
   ========================================================================== */

import { STORAGE, appState } from './state.js';
import { showToast, stringToHex, validatePassword } from './utils.js';
import { getUsersDb, setUsersDb, loadUserData } from './storage.js';
import { updateCategoryOptions, updateUI } from './render.js';
import { loadRandomInsight, loadExchangeRate } from './services.js';
import { setCurrentDateInTransactionForm } from './modals.js';

// ==========================================================================
// 1. CONTROLE DE TELA (LOGIN vs APP)
// ==========================================================================

/**
 * Exibe a tela de Login/Cadastro e esconde a aplicação principal.
 */
export function showAuthScreen() {
  const app = document.getElementById('app-screen');
  const header = document.querySelector('header');
  const auth = document.getElementById('auth-screen');
    
  if (app) app.style.display = 'none';
  if (header) header.style.display = 'none'; // Esconde menu superior
  
  if (auth) {
    auth.style.display = 'flex';
    auth.style.top = '0';
    auth.style.height = '100vh'; // Garante tela cheia
  }
}

/**
 * Exibe o Dashboard principal e esconde a tela de Login.
 * Atualiza a saudação do usuário no Header.
 */
export function showAppScreen() {
  const app = document.getElementById('app-screen');
  const header = document.querySelector('header');
  const auth = document.getElementById('auth-screen');
  
  if (app) app.style.display = 'block';
  if (header) header.style.display = 'block';
  
  if (auth) {
    auth.style.display = 'none';
    auth.style.top = '';
    auth.style.height = '';
  }
  
  // Atualiza saudação
  const title = document.getElementById('app-title');
  if (title && appState.currentUser) {
      title.textContent = `Olá, ${appState.currentUser}`;
  }
}

/**
 * Alterna o formulário entre os modos "Entrar" e "Criar Conta".
 * Limpa os campos para evitar confusão.
 */
export function toggleAuthMode() {
  const card = document.getElementById('auth-card');
  const titleEl = document.getElementById('auth-title');
  const loginBtn = document.getElementById('auth-login-btn');
  const registerBtn = document.getElementById('auth-register-btn');
  const toggleLink = document.getElementById('auth-toggle-link');
  const usernameInput = document.getElementById('auth-username');
  const passwordInput = document.getElementById('auth-password');

  if (!card) return;

  const isRegister = card.classList.toggle('mode-register');

  if (isRegister) {
    if (titleEl) titleEl.textContent = 'Criar Conta';
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'inline-flex';
    if (toggleLink) toggleLink.textContent = 'Já tem conta? Entrar';
  } else {
    if (titleEl) titleEl.textContent = 'Entrar';
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (registerBtn) registerBtn.style.display = 'none';
    if (toggleLink) toggleLink.textContent = 'Não tem conta? Criar agora';
  }

  // Limpa campos
  if (usernameInput) usernameInput.value = '';
  if (passwordInput) passwordInput.value = '';
}

// ==========================================================================
// 2. LÓGICA DE LOGIN E REGISTRO
// ==========================================================================

/**
 * Autentica o usuário.
 * Se sucesso: Carrega dados, widgets e exibe o app.
 */
export function loginUser(username, password) {
  if (!username || !password) return;

  const users = getUsersDb();
  // Verifica credenciais (senha hashada)
  const user = users.find(u => u.username === username && u.password === stringToHex(password));

  if (user) {
    // 1. Define Sessão
    appState.currentUser = username;
    localStorage.setItem(STORAGE.CURRENT_USER, username);

    // 2. Carrega Dados
    loadUserData();

    // 3. Atualiza Interface
    showAppScreen();
    updateCategoryOptions();
    updateUI();
    
    // 4. Carrega Serviços Externos
    loadRandomInsight();
    loadExchangeRate();
    setCurrentDateInTransactionForm();

  } else {
    showToast('Usuário ou senha inválidos.', 'error');
  }
}

/**
 * Cria um novo usuário.
 * Verifica duplicidade e força da senha.
 */
export function registerUser(username, password) {
  if (!username || !password) return;

  // Validação de segurança
  const error = validatePassword(password);
  if (error) {
    showToast(error, 'warning');
    return;
  }

  const users = getUsersDb();
  if (users.some(u => u.username === username)) { 
      showToast('Usuário já existe.', 'warning'); 
      return; 
  }

  // Salva novo usuário
  users.push({ 
      username, 
      password: stringToHex(password), 
      data: { accounts: [], transactions: [] } 
  });
  setUsersDb(users);

  // Auto-login após cadastro
  loginUser(username, password);
  showToast('Conta criada com sucesso!', 'success');
}

/**
 * Inicialização (Boot).
 * Chamado ao carregar a página. Se já houver login salvo, entra direto.
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
 * Passo 1: Abre modal para digitar o usuário.
 */
export function openForgotUsernameModal() {
  const m = document.getElementById('forgot-username-modal');
  if (m) m.classList.add('active');
}

/**
 * Passo 2: Verifica usuário e permite definir nova senha.
 * Define o evento de clique do botão "Salvar" dinamicamente.
 */
export function proceedForgotPassword(username) {
  const users = getUsersDb();
  const user = users.find(u => u.username === username);

  if (!user) { 
      showToast('Usuário não encontrado.', 'error'); 
      return; 
  }

  // Troca de Modais
  const m1 = document.getElementById('forgot-username-modal');
  const m2 = document.getElementById('forgot-new-password-modal');
  
  if (m1) m1.classList.remove('active');
  if (m2) m2.classList.add('active');

  // Configura ação de salvar
  const saveBtn = document.getElementById('forgot-new-password-save-btn');
  const input = document.getElementById('forgot-new-password-input');

  if (saveBtn && input) {
    // Usa .onclick para sobrescrever eventos anteriores e evitar duplicidade
    saveBtn.onclick = () => {
      const pw = input.value.trim();
      
      // Validação simples
      if (!pw) { 
          showToast('Informe a nova senha.', 'warning'); 
          return; 
      }
      
      const idx = users.findIndex(u => u.username === username);
      if (idx !== -1) {
        // Atualiza senha
        users[idx].password = stringToHex(pw);
        setUsersDb(users);

        // Loga o usuário automaticamente
        appState.currentUser = username;
        localStorage.setItem(STORAGE.CURRENT_USER, username);
        
        loadUserData();
        showAppScreen();
        updateCategoryOptions();
        updateUI();
        
        // Limpeza
        if (m2) m2.classList.remove('active');
        input.value = '';
        showToast('Senha redefinida com sucesso.', 'success');
      }
    };
  }
}