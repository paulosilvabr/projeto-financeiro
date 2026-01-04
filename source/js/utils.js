/* ==========================================================================
   UTILITÁRIOS (UTILS.JS)
   --------------------------------------------------------------------------
   Funções auxiliares genéricas usadas em todo o sistema.
   ========================================================================== */

// ==========================================================================
// 1. GERADORES (IDs e Cores)
// ==========================================================================

/**
 * Gera um ID único simples baseado em timestamp e aleatoriedade.
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Gera uma cor HSL aleatória, tentando evitar repetições imediatas.
 * @param {Array} used - Lista de cores já utilizadas.
 * @param {string|null} last - Última cor gerada.
 */
export function generateRandomColor(used = [], last = null) {
  const step = 37; // Passo primo para variar o Hue
  let h = Math.floor(Math.random() * 360);
  
  // Tenta encontrar uma cor não usada
  for (let i = 0; i < 10; i++) {
    const color = `hsl(${(h + i * step) % 360}, 70%, 55%)`;
    if (!used.includes(color) && color !== last) return color;
  }
  
  // Fallback: gera qualquer uma se não encontrar única
  let color;
  do { 
    color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`; 
  } while (color === last);
  
  return color;
}

// ==========================================================================
// 2. FORMATADORES (Moeda e Data)
// ==========================================================================

export function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Converte data BR (dd/mm/aaaa) para ISO (aaaa-mm-dd) válida.
 * Retorna null se a data for inválida (ex: 31/02).
 */
export function parseDateBRToISO(str) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str || '');
  if (!m) return null;

  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const y = parseInt(m[3], 10);

  // Cria data para validar (o JS corrige 31/02 para 03/03 automaticamente)
  const dt = new Date(y, mo - 1, d);
  
  // Se o JS corrigiu a data, significa que a original era inválida
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;

  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ==========================================================================
// 3. SEGURANÇA
// ==========================================================================

/**
 * Converte string para Hexadecimal (Ofuscação simples).
 */
export const stringToHex = (str) => {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += '' + str.charCodeAt(i).toString(16);
  }
  return hex;
};

/**
 * Valida regras de senha (mínimo 8 chars, maiúscula, minúscula, especial).
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

export function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  
  c.appendChild(t);
  setTimeout(() => { t.remove(); }, 3500);
}

export function showConfirmModal(message, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const msgEl = document.getElementById('confirm-message');
  const okBtn = document.getElementById('confirm-ok-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');

  if (!modal || !msgEl || !okBtn || !cancelBtn) return;

  msgEl.textContent = message;
  modal.classList.add('active');

  // Remove listeners antigos clonando os botões (Hack limpo para evitar múltiplos disparos)
  const newOk = okBtn.cloneNode(true);
  const newCancel = cancelBtn.cloneNode(true);
  okBtn.replaceWith(newOk);
  cancelBtn.replaceWith(newCancel);

  const cleanup = () => { modal.classList.remove('active'); };

  newOk.addEventListener('click', () => { 
    if (onConfirm) onConfirm(); 
    cleanup(); 
  });
  
  newCancel.addEventListener('click', cleanup);
}

// --- Persistência de Cores do Gráfico ---

export function getChartColors(userKey = 'default') {
  try {
    const raw = localStorage.getItem(`chart_colors_${userKey}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function setChartColors(userKey = 'default', map = {}) {
  try {
    localStorage.setItem(`chart_colors_${userKey}`, JSON.stringify(map));
  } catch {}
}