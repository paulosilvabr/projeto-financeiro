export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.remove(); }, 3500);
}

export const stringToHex = (str) => {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += '' + str.charCodeAt(i).toString(16);
  }
  return hex;
};

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

export function getChartColors(userKey = 'default') {
  try {
    const raw = localStorage.getItem(`chart_colors_${userKey}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setChartColors(userKey = 'default', map = {}) {
  try {
    localStorage.setItem(`chart_colors_${userKey}`, JSON.stringify(map));
  } catch {}
}
