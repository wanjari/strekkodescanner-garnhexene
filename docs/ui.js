// ui.js - UI-hjelpefunksjoner for varetelling

export function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

export function decodeHtmlEntities(str) {
    if (!str) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
}

export function showToast(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.className = 'toast', 2500);
}

export function updateScannerStatus(text) {
    const el = document.getElementById('scannerStatus');
    if (el) {
        if (text.includes('Laster')) {
            el.innerHTML = '<span class="spinner"></span> ' + text;
        } else {
            el.textContent = text;
        }
    }
}
