// api.js - API-kommunikasjon for varetelling

let config = { shopName: '', apiKey: '' };

export function setConfig(shopName, apiKey) {
    config.shopName = shopName;
    config.apiKey = apiKey;
}

export function apiBase() {
    return `https://api.mystore.no/shops/${config.shopName}`;
}

export async function apiFetch(path, options = {}, _retry = 0) {
    const url = apiBase() + path;
    const headers = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/vnd.api+json',
        ...(options.headers || {})
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let r;
    try {
        r = await fetch(url, { ...options, headers, signal: controller.signal });
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') throw new Error('Tidsavbrudd – ingen svar fra API etter 15s');
        throw err;
    }
    clearTimeout(timeout);
    const text = await r.text();

    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (r.status === 429 && _retry < 4) {
        const retryAfter = parseInt(r.headers.get('Retry-After') || '0') * 1000;
        const wait = retryAfter || (2 ** (_retry + 1)) * 1000;
        await new Promise(res => setTimeout(res, wait));
        return apiFetch(path, options, _retry + 1);
    }

    if (!r.ok) {
        throw new Error(`HTTP ${r.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
    }

    return data;
}

export async function fetchAllPages(path, maxPages = 50, onPageProgress = null) {
    const sep = path.includes('?') ? '&' : '?';
    const firstData = await apiFetch(`${path}${sep}page[number]=1`);
    const allItems = [...(firstData.data || [])];

    let lastPage = 1;
    if (firstData.links?.last) {
        const m = firstData.links.last.match(/page\[number\]=(\d+)/);
        if (m) lastPage = Math.min(parseInt(m[1]), maxPages);
    }

    for (let p = 2; p <= lastPage; p++) {
        const d = await apiFetch(`${path}${sep}page[number]=${p}`);
        allItems.push(...(d.data || []));
        if (onPageProgress) onPageProgress(p, lastPage);
    }

    return allItems;
}

export async function fetchAllPagesRaw(path, maxPages = 50, onPageProgress = null) {
    const sep = path.includes('?') ? '&' : '?';
    const firstPage = await apiFetch(`${path}${sep}page[number]=1`);
    const allPages = [firstPage];

    let lastPage = 1;
    if (firstPage.links?.last) {
        const m = firstPage.links.last.match(/page\[number\]=(\d+)/);
        if (m) lastPage = Math.min(parseInt(m[1]), maxPages);
    }

    for (let p = 2; p <= lastPage; p++) {
        const page = await apiFetch(`${path}${sep}page[number]=${p}`);
        allPages.push(page);
        if (onPageProgress) await onPageProgress(p, lastPage);
    }

    return allPages;
}

export async function updateVariantStock(variantId, quantity) {
    return apiFetch(`/product-variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/vnd.api+json' },
        body: JSON.stringify({
            data: {
                type: 'product-variants',
                id: String(variantId),
                attributes: { quantity }
            }
        })
    });
}

export async function updateProductStock(productId, quantity) {
    return apiFetch(`/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/vnd.api+json' },
        body: JSON.stringify({
            data: {
                type: 'products',
                id: String(productId),
                attributes: { quantity }
            }
        })
    });
}
