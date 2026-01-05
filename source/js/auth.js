/* ==========================================================================
   AUTENTICAÇÃO E SESSÃO (AUTH.JS)
   --------------------------------------------------------------------------
   Gerencia o ciclo de vida da sessão do usuário: Login, Registro, Logout,
   Recuperação de Senha e Inicialização (Boot) do sistema.
   ========================================================================== */

import { STORAGE, appState } from './state.js';
import { showToast, stringToHex, validatePassword } from './utils.js';
import { getUsersDb, setUsersDb, loadUserData } from './storage.js';
import { updateCategoryOptions, updateUI } from './render.js';
import { loadRandomInsight, loadExchangeRate } from './services.js';
import { setCurrentDateInTransactionForm } from './modals.js';

// ==========================================================================
// 1. CONTROLE DE TELA (UI SWAP)
// ==========================================================================

/**
 * Exibe a tela de Login/Cadastro e esconde a aplicação principal.
 * Usado no logout ou quando não há sessão ativa.
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
 * Chamado após autenticação bem-sucedida.
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

    // Atualiza saudação no header
    const title = document.getElementById('app-title');
    if (title && appState.currentUser) {
        title.textContent = `Olá, ${appState.currentUser}`;
    }
}

/**
 * Alterna o formulário de autenticação entre os modos "Entrar" e "Criar Conta".
 * Atualiza títulos, botões e limpa os campos para evitar confusão.
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

    // Ajusta textos e visibilidade dos botões
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

    // Limpa campos para resetar o estado visual
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
}

// ==========================================================================
// 2. LÓGICA DE AUTENTICAÇÃO (LOGIN/REGISTRO)
// ==========================================================================

/**
 * Tenta autenticar o usuário com as credenciais fornecidas.
 * Se sucesso: Define sessão, carrega dados e inicializa a UI.
 * @param {string} username - Nome de usuário.
 * @param {string} password - Senha (em texto plano).
 */
export function loginUser(username, password) {
    if (!username || !password) return;

    const users = getUsersDb();
    // Verifica credenciais comparando o hash Hexadecimal
    const user = users.find(u => u.username === username && u.password === stringToHex(password));

    if (user) {
        // 1. Define Sessão
        appState.currentUser = username;
        localStorage.setItem(STORAGE.CURRENT_USER, username);

        // 2. Carrega Dados do Usuário para a Memória
        loadUserData();

        // 3. Atualiza Interface e Widgets
        showAppScreen();
        updateCategoryOptions();
        updateUI();

        // 4. Carrega Serviços Externos (API e JSON)
        loadRandomInsight();
        loadExchangeRate();
        setCurrentDateInTransactionForm();

    } else {
        showToast('Usuário ou senha inválidos.', 'error');
    }
}

/**
 * Cria um novo usuário no sistema.
 * Verifica requisitos de senha e unicidade de username.
 * @param {string} username - Nome de usuário desejado.
 * @param {string} password - Senha desejada.
 */
export function registerUser(username, password) {
    if (!username || !password) return;

    // Validação de segurança da senha
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

    // Salva novo usuário com estrutura de dados vazia
    users.push({
        username,
        password: stringToHex(password),
        data: { accounts: [], transactions: [] }
    });
    setUsersDb(users);

    // Realiza login automático após cadastro
    loginUser(username, password);
    showToast('Conta criada com sucesso!', 'success');
}

/**
 * Inicialização do Sistema (Boot).
 * Verifica se já existe uma sessão salva no LocalStorage.
 * Se sim, restaura o estado e entra direto; se não, mostra tela de login.
 */
export function boot() {
    const storedUser = localStorage.getItem(STORAGE.CURRENT_USER);

    if (storedUser) {
        // Restaura Sessão
        appState.currentUser = storedUser;
        loadUserData();
        
        // Inicializa App
        showAppScreen();
        updateCategoryOptions();
        updateUI();
        loadRandomInsight();
        loadExchangeRate();
        setCurrentDateInTransactionForm();
    } else {
        // Exige Login
        showAuthScreen();
    }
}

// ==========================================================================
// 3. FLUXO DE RECUPERAÇÃO DE SENHA
// ==========================================================================

/**
 * Passo 1: Abre modal para o usuário informar seu username.
 */
export function openForgotUsernameModal() {
    const m = document.getElementById('forgot-username-modal');
    if (m) m.classList.add('active');
}

/**
 * Passo 2: Verifica se o usuário existe e permite definir uma nova senha.
 * Define dinamicamente o evento de clique do botão "Salvar" do modal de nova senha.
 * @param {string} username - Usuário que deseja recuperar a senha.
 */
export function proceedForgotPassword(username) {
    const users = getUsersDb();
    const user = users.find(u => u.username === username);

    if (!user) {
        showToast('Usuário não encontrado.', 'error');
        return;
    }

    // Troca de Modais (Fecha Username -> Abre Nova Senha)
    const m1 = document.getElementById('forgot-username-modal');
    const m2 = document.getElementById('forgot-new-password-modal');

    if (m1) m1.classList.remove('active');
    if (m2) m2.classList.add('active');

    // Configura a ação de salvar a nova senha
    const saveBtn = document.getElementById('forgot-new-password-save-btn');
    const input = document.getElementById('forgot-new-password-input');
    // CORREÇÃO: Pega o formulário para tratar o "Enter"
    const form = document.getElementById('forgot-new-password-form');

    // Lógica para Salvar Nova Senha
    const performSave = () => {
        const pw = input.value; // Valor puro

        if (!pw) {
            showToast('Informe a nova senha.', 'warning');
            return;
        }

        const error = validatePassword(pw);
        if (error) {
            showToast(error, 'warning');
            return;
        }

        const idx = users.findIndex(u => u.username === username);
        if (idx !== -1) {
            // Atualiza a senha no banco
            users[idx].password = stringToHex(pw);
            setUsersDb(users);

            // Loga o usuário automaticamente com a nova credencial
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

    if (saveBtn) {
        // Garante que o evento de clique não se acumule
        saveBtn.onclick = performSave;
    }

    if (form) {
        // Garante que o ENTER não recarregue a página
        form.onsubmit = (e) => {
            e.preventDefault();
            performSave();
        };
    }
}