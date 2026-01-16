// PayPal SDK Dynamic Loader
// This script helps load PayPal SDK with the correct currency

async function loadPayPalSDK(currency) {
    console.log('Loading PayPal SDK with currency:', currency);

    // Check if already loaded with correct currency
    if (window.paypal && window.paypalLoadedCurrency === currency) {
        console.log('PayPal SDK already loaded with currency:', currency);
        return Promise.resolve();
    }

    // Remove existing PayPal script if present
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (existingScript) {
        console.log('Removing existing PayPal script');
        existingScript.remove();
        delete window.paypal; // Clear existing PayPal instance
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    return new Promise((resolve, reject) => {
        const clientId = 'AYlPajZuMhLjIL9YYm8yLtlxCc-3DvlU-PfbhH-BYk2Xp0mWCbnQvScMPlZKsxkihvUaD9goUvHKMfxT';
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
        script.async = true;

        script.onload = () => {
            console.log('PayPal SDK loaded successfully with currency:', currency);
            window.paypalLoadedCurrency = currency; // Track loaded currency
            resolve();
        };

        script.onerror = (error) => {
            console.error('Failed to load PayPal SDK:', error);
            reject(new Error('Failed to load PayPal SDK'));
        };

        document.head.appendChild(script);
    });
}

// Make globally available
window.loadPayPalSDK = loadPayPalSDK;
