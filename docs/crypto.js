// crypto.js - krypteringsfunksjoner for varetelling (globalt script)

// Deriverer nøkkel fra PIN og salt
async function deriveKey(pin, salt) {
    const keyMaterial = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false, ['encrypt', 'decrypt']
    );
}

// Krypterer butikknavn og API-nøkkel
async function encryptCredentials(shopName, apiKey, pin) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const key  = await deriveKey(pin, salt);
    const data = new TextEncoder().encode(JSON.stringify({ shopName, apiKey }));
    const enc  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    const combined = new Uint8Array(16 + 12 + enc.byteLength);
    combined.set(salt, 0); combined.set(iv, 16); combined.set(new Uint8Array(enc), 28);
    return btoa(String.fromCharCode(...combined));
}

// Dekrypterer lagrede innstillinger
async function decryptCredentials(stored, pin) {
    const combined = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const iv   = combined.slice(16, 28);
    const ct   = combined.slice(28);
    const key  = await deriveKey(pin, salt);
    const dec  = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(dec));
}
