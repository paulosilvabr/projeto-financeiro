/* ==========================================================================
   UTILITÁRIOS (UTILS)
   --------------------------------------------------------------------------
   Funções auxiliares genéricas usadas em todo o sistema.
   ========================================================================== */

// ==========================================================================
// 1. GERADORES DE DADOS
// ==========================================================================
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Gera uma cor HSL aleatória, garantindo que não seja igual à última usada.
 * Utilizada para colorir automaticamente as categorias no gráfico de rosca.
 * @param {Array} used - Lista de cores já utilizadas (opcional).
 * @param {string|null} last - Última cor gerada para evitar repetição direta.
 * @returns {string} Cor em formato HSL (ex: "hsl(120, 70%, 55%)").
 */
export function generateRandomColor(used = [], last = null) {
  const step = 37;
  let h = Math.floor(Math.random() * 360);
  for (let i = 0; i < 10; i++) {
    const color = `hsl(${(h + i * step) % 360}, 70%, 55%)`;
    if (!used.includes(color) && color !== last) return color;
  }
  let color;
  do { color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`; } while (color === last);
  return color;
}

// ==========================================================================
// 2. FORMATADORES (MOEDA / DATA)
// ==========================================================================
export function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata um valor numérico para o padrão de moeda brasileiro (Real).
 * @param {number} value - Valor numérico a ser formatado.
 * @returns {string} String formatada (ex: "R$ 1.250,00").
 */
export function parseDateBRToISO(str) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str || '');
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  const mm = String(mo).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/**
 * Converte uma string (senha) para sua representação Hexadecimal.
 * Usado como um método simples de ofuscação de senha antes de salvar no LocalStorage.
 * @param {string} str - String original.
 * @returns {string} String em hexadecimal.
 */
export const stringToHex = (str) => {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += '' + str.charCodeAt(i).toString(16);
  }
  return hex;
};

// ==========================================================================
// 3. UI HELPERS (TOAST / MODAL / CORES)
// ==========================================================================
/**
 * Exibe uma notificação flutuante (Toast) na tela.
 * A mensagem desaparece automaticamente após 3.5 segundos.
 * @param {string} msg - Texto da mensagem.
 * @param {string} type - Tipo de alerta ('info', 'success', 'error', 'warning').
 */
export function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.remove(); }, 3500);
}

/**
 * Exibe um modal de confirmação genérico para ações destrutivas.
 * @param {string} message - Pergunta a ser feita ao usuário (ex: "Tem certeza?").
 * @param {Function} onConfirm - Função de callback executada se o usuário clicar em "Confirmar".
 */
export function showConfirmModal(message, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const msgEl = document.getElementById('confirm-message');
  const okBtn = document.getElementById('confirm-ok-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');
  if (!modal || !msgEl || !okBtn || !cancelBtn) return;
  msgEl.textContent = message;
  modal.classList.add('active');
  const cleanup = () => {
    modal.classList.remove('active');
    okBtn.replaceWith(okBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
  };
  okBtn.addEventListener('click', () => { try { onConfirm && onConfirm(); } finally { cleanup(); } });
  cancelBtn.addEventListener('click', cleanup);
}

/**
 * Recupera o mapa de cores persistido no LocalStorage para um usuário.
 * Garante que as categorias mantenham a mesma cor entre recargas de página.
 * @param {string} userKey - Identificador do usuário (padrão 'default').
 * @returns {Object} Objeto mapeando categoria -> cor.
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
 * Salva o mapa de cores atualizado no LocalStorage.
 * @param {string} userKey - Identificador do usuário.
 * @param {Object} map - Objeto com as cores das categorias.
 */
export function setChartColors(userKey = 'default', map = {}) {
  try {
    localStorage.setItem(`chart_colors_${userKey}`, JSON.stringify(map));
  } catch {}
}

// ==========================================================================
// 4. SEGURANÇA E VALIDAÇÃO (NOVO)
// ==========================================================================
/**
 * Valida a força da senha baseada em regras de segurança (comprimento, caracteres especiais, etc).
 * @param {string} password - A senha a ser validada.
 * @returns {string|null} Retorna mensagem de erro se inválida, ou null se válida.
 */
export function validatePassword(password) {
  if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
  if (!/[A-Z]/.test(password)) return 'A senha deve ter pelo menos uma letra maiúscula.'
  if (!/[a-z]/.test(password)) return 'A senha deve ter pelo menos uma letra minúscula'
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'A senha deve ter ao menos um caracter especial'
  return null; // Valor para senha inválida
}
