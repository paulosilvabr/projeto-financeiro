/* ==========================================================================
   UTILITÁRIOS (UTILS.JS)
   --------------------------------------------------------------------------
   Biblioteca de funções auxiliares genéricas usadas em todo o sistema.
   Contém helpers para formatação, geração de IDs, segurança e UI.
   ========================================================================== */

// ==========================================================================
// 1. GERADORES (IDs e Cores)
// ==========================================================================

/**
 * Gera um ID único simples baseado no timestamp atual e aleatoriedade.
 * Usado para criar identificadores para contas e transações.
 * @returns {string} ID alfanumérico.
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Gera uma cor HSL aleatória, tentando evitar repetições imediatas.
 * Útil para gráficos onde categorias precisam de cores distintas.
 * * @param {Array<string>} used - Lista de cores já utilizadas para evitar colisão.
 * @param {string|null} last - Última cor gerada para evitar repetição sequencial.
 * @returns {string} Cor em formato HSL (ex: "hsl(120, 70%, 55%)").
 */
export function generateRandomColor(used = [], last = null) {
    const step = 37; // Passo primo para variar o Hue e criar contraste
    let h = Math.floor(Math.random() * 360);

    // Tenta encontrar uma cor não usada
    for (let i = 0; i < 10; i++) {
        const color = `hsl(${(h + i * step) % 360}, 70%, 55%)`;
        if (!used.includes(color) && color !== last) return color;
    }

    // Fallback: gera qualquer uma se não encontrar única após tentativas
    let color;
    do {
        color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`;
    } while (color === last);

    return color;
}

// ==========================================================================
// 2. FORMATADORES (Moeda e Data)
// ==========================================================================

/**
 * Formata um número para o padrão de moeda brasileiro (BRL).
 * @param {number} value - Valor numérico (ex: 1200.50).
 * @returns {string} String formatada (ex: "R$ 1.200,50").
 */
export function formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

/**
 * Converte data do formato BR (dd/mm/aaaa) para ISO (aaaa-mm-dd).
 * Realiza validação real de calendário (ex: rejeita 31/02).
 * * @param {string} str - Data em string (dd/mm/aaaa).
 * @returns {string|null} Data ISO ou null se inválida.
 */
export function parseDateBRToISO(str) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str || '');
    if (!m) return null;

    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const y = parseInt(m[3], 10);

    // Cria objeto Date para validar (JS corrige datas inválidas automaticamente, ex: 31/02 -> 03/03)
    const dt = new Date(y, mo - 1, d);

    // Se o dia/mês/ano do objeto diferir da entrada, a data original era inválida
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;

    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ==========================================================================
// 3. SEGURANÇA E VALIDAÇÃO
// ==========================================================================

/**
 * Converte uma string para Hexadecimal.
 * Usado como ofuscação simples para senhas no LocalStorage (NÃO É CRIPTOGRAFIA REAL).
 * @param {string} str - Texto original.
 * @returns {string} Texto em Hex.
 */
export const stringToHex = (str) => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
};

/**
 * Valida se a senha atende aos requisitos de segurança.
 * Regras: Min 8 chars, 1 Maiúscula, 1 Minúscula, 1 Especial.
 * * @param {string} password - Senha para validar.
 * @returns {string|null} Mensagem de erro ou null se válida.
 */
export function validatePassword(password) {
    if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    if (!/[A-Z]/.test(password)) return 'A senha deve ter pelo menos uma letra maiúscula.';
    if (!/[a-z]/.test(password)) return 'A senha deve ter pelo menos uma letra minúscula.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'A senha deve ter ao menos um caracter especial.';
    return null;
}

// ==========================================================================
// 4. UI HELPERS (Toast e Modais)
// ==========================================================================

/**
 * Exibe uma notificação flutuante (Toast) na tela.
 * @param {string} msg - Mensagem a ser exibida.
 * @param {'success'|'error'|'info'|'warning'} type - Tipo da notificação (define a cor).
 */
export function showToast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    if (!c) return;

    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;

    c.appendChild(t);
    // Remove automaticamente após 3.5 segundos
    setTimeout(() => {
        t.remove();
    }, 3500);
}

/**
 * Exibe um modal de confirmação genérico.
 * @param {string} message - Pergunta a ser feita ao usuário.
 * @param {Function} onConfirm - Callback executado se o usuário clicar em "Confirmar".
 */
export function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    if (!modal || !msgEl || !okBtn || !cancelBtn) return;

    msgEl.textContent = message;
    modal.classList.add('active');

    // Clona os botões para remover event listeners antigos e evitar disparos múltiplos
    const newOk = okBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    okBtn.replaceWith(newOk);
    cancelBtn.replaceWith(newCancel);

    const cleanup = () => {
        modal.classList.remove('active');
    };

    newOk.addEventListener('click', () => {
        if (onConfirm) onConfirm();
        cleanup();
    });

    newCancel.addEventListener('click', cleanup);
}

// ==========================================================================
// 5. MÁSCARAS DE INPUT (UX)
// ==========================================================================

/**
 * Aplica máscara de moeda brasileira enquanto o usuário digita.
 * Transforma "1234" em "R$ 12,34".
 * @param {string} value - Valor bruto do input.
 * @returns {string} Valor formatado.
 */
export function maskCurrencyInput(value) {
    const cleanValue = value.replace(/\D/g, ""); // Remove não-dígitos

    if (!cleanValue) return "";

    const numberValue = parseInt(cleanValue, 10) / 100;

    return numberValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

/**
 * Converte uma string formatada (R$ 1.200,50) de volta para Float (1200.50).
 * Necessário para salvar no banco de dados.
 * @param {string} str - String formatada.
 * @returns {number} Valor numérico float.
 */
export function parseCurrencyString(str) {
    if (!str) return 0;

    // Remove R$, espaços e pontos de milhar. Troca vírgula decimal por ponto.
    const clean = str.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
}

// ==========================================================================
// 6. PERSISTÊNCIA AUXILIAR (Cores de Gráfico)
// ==========================================================================

/**
 * Recupera o mapa de cores salvo para um usuário.
 * Garante consistência visual entre recarregamentos.
 * @param {string} userKey - Identificador do usuário.
 * @returns {Object} Mapa de cores { categoria: cor }.
 */
export function getChartColors(userKey = 'default') {
    try {
        const raw = localStorage.getItem(`chart_colors_${userKey}`);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

/**
 * Salva o mapa de cores atualizado.
 * @param {string} userKey - Identificador do usuário.
 * @param {Object} map - Mapa de cores atualizado.
 */
export function setChartColors(userKey = 'default', map = {}) {
    try {
        localStorage.setItem(`chart_colors_${userKey}`, JSON.stringify(map));
    } catch {}
}