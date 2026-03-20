// scanner.js - strekkodeskanner og relaterte funksjoner

export let html5QrCode = null;
export let isScanning = false;
export let lastScannedCode = '';
export let lastScanTime = 0;

export function startScanner(onScanSuccess, updateScannerStatus) {
    html5QrCode = new Html5Qrcode("reader");

    const scanConfig = {
        fps: 8,
        aspectRatio: 1.5,
        formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.CODABAR,
        ]
    };

    html5QrCode.start(
        { facingMode: "environment" },
        scanConfig,
        onScanSuccess,
        (errorMessage) => {
            if (updateScannerStatus) updateScannerStatus('Skanningsfeil: ' + errorMessage);
        }
    ).then(() => {
        isScanning = true;
        if (updateScannerStatus) updateScannerStatus('Skann en strekkode...');
    }).catch(err => {
        if (updateScannerStatus) updateScannerStatus('Kamera ikke tilgjengelig – bruk manuelt felt. Feil: ' + err.message);
    });
}

export function stopScanner() {
    if (isScanning && html5QrCode) {
        html5QrCode.stop().catch(() => {});
        isScanning = false;
    }
}
