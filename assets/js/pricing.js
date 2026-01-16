// ================================================
// ZELERA - Dynamic Pricing System
// Multi-currency support with real-time conversion
// ================================================

// Currency conversion rates (base: INR)
const EXCHANGE_RATES = {
    INR: 1,
    USD: 0.012,   // 1 INR = 0.012 USD
    EUR: 0.011,   // 1 INR = 0.011 EUR
    GBP: 0.0095   // 1 INR = 0.0095 GBP
};

// Base prices in INR
// Base prices in INR
const BASE_PRICES = {
    basic: 75000,
    standard: 100000,
    premium: 150000
};

// Currency symbols
const CURRENCY_SYMBOLS = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£'
};

// Country to currency mapping
const COUNTRY_CURRENCY_MAP = {
    'India': 'INR',
    'USA': 'USD',
    'UK': 'GBP',
    'Germany': 'EUR',
    'France': 'EUR',
    'Spain': 'EUR',
    'Italy': 'EUR',
    'Netherlands': 'EUR',
    'Canada': 'USD',
    'Australia': 'USD',
    'Singapore': 'USD',
    'UAE': 'USD'
};

class PricingManager {
    constructor() {
        this.currentCurrency = this.loadStoredCurrency() || 'INR';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAllPrices();
        this.detectUserLocation();
    }

    setupEventListeners() {
        // Country/Currency selectors
        const currencySelectors = document.querySelectorAll('[data-currency-selector]');
        currencySelectors.forEach(selector => {
            selector.addEventListener('change', (e) => {
                this.changeCurrency(e.target.value);
            });

            // Set current value
            selector.value = this.currentCurrency;
        });

        // NOTE: Removed currencyChanged event listener here as it causes infinite loop
        // changeCurrency already dispatches this event, so listening to it creates recursion
    }

    async detectUserLocation() {
        try {
            // Try to detect user's location automatically
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();

            if (data.country_name && COUNTRY_CURRENCY_MAP[data.country_name]) {
                const detectedCurrency = COUNTRY_CURRENCY_MAP[data.country_name];

                // Only auto-set if user hasn't manually selected before
                if (!localStorage.getItem('userSelectedCurrency')) {
                    this.changeCurrency(detectedCurrency, false);
                }
            }
        } catch (error) {
            console.log('Could not detect location, using default currency');
        }
    }

    changeCurrency(currency, savePreference = true) {
        if (!EXCHANGE_RATES[currency]) {
            console.error('Invalid currency:', currency);
            return;
        }

        this.currentCurrency = currency;

        // Save to localStorage if user manually selected
        if (savePreference) {
            localStorage.setItem('userSelectedCurrency', currency);
        }

        // Update all prices on the page
        this.updateAllPrices();

        // Update all currency selectors
        const selectors = document.querySelectorAll('[data-currency-selector]');
        selectors.forEach(selector => {
            selector.value = currency;
        });

        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('currencyChanged', {
            detail: { currency }
        }));
    }

    convertPrice(priceINR, currency = null) {
        const targetCurrency = currency || this.currentCurrency;
        const convertedPrice = priceINR * EXCHANGE_RATES[targetCurrency];

        // Round to appropriate decimal places
        if (targetCurrency === 'INR') {
            return Math.round(convertedPrice);
        } else {
            return Math.round(convertedPrice);
        }
    }

    formatPrice(price, currency = null) {
        const targetCurrency = currency || this.currentCurrency;
        const symbol = CURRENCY_SYMBOLS[targetCurrency];
        const formattedNumber = price.toLocaleString();

        return `${symbol}${formattedNumber}`;
    }

    updateAllPrices() {
        // Update basic plan prices
        const basicPrices = document.querySelectorAll('[data-price="basic"]');
        const basicPrice = this.convertPrice(BASE_PRICES.basic);

        basicPrices.forEach(element => {
            element.textContent = this.formatPrice(basicPrice);
            element.dataset.amount = basicPrice;
            element.dataset.currency = this.currentCurrency;
        });

        // Update standard plan prices
        const standardPrices = document.querySelectorAll('[data-price="standard"]');
        const standardPrice = this.convertPrice(BASE_PRICES.standard);

        standardPrices.forEach(element => {
            element.textContent = this.formatPrice(standardPrice);
            element.dataset.amount = standardPrice;
            element.dataset.currency = this.currentCurrency;
        });

        // Update premium plan prices
        const premiumPrices = document.querySelectorAll('[data-price="premium"]');
        const premiumPrice = this.convertPrice(BASE_PRICES.premium);

        premiumPrices.forEach(element => {
            element.textContent = this.formatPrice(premiumPrice);
            element.dataset.amount = premiumPrice;
            element.dataset.currency = this.currentCurrency;
        });

        // Update any custom price elements
        const customPrices = document.querySelectorAll('[data-price-inr]');
        customPrices.forEach(element => {
            const priceINR = parseFloat(element.dataset.priceInr);
            const convertedPrice = this.convertPrice(priceINR);
            element.textContent = this.formatPrice(convertedPrice);
        });
    }

    loadStoredCurrency() {
        return localStorage.getItem('userSelectedCurrency');
    }

    getCurrentCurrency() {
        return this.currentCurrency;
    }

    getCurrentPrice(plan) {
        if (!BASE_PRICES[plan]) {
            console.error('Invalid plan:', plan);
            return 0;
        }

        return this.convertPrice(BASE_PRICES[plan]);
    }

    getPriceData(plan) {
        const price = this.getCurrentPrice(plan);

        return {
            amount: price,
            currency: this.currentCurrency,
            formatted: this.formatPrice(price),
            symbol: CURRENCY_SYMBOLS[this.currentCurrency]
        };
    }
}

// Initialize pricing manager when DOM is ready
let pricingManager;

document.addEventListener('DOMContentLoaded', function () {
    pricingManager = new PricingManager();

    // Make pricingManager globally available
    window.pricingManager = pricingManager;

    // Add currency selector HTML to pages if not exists
    addCurrencySelectorIfNeeded();
});

// Helper function to add currency selector
function addCurrencySelectorIfNeeded() {
    const containers = document.querySelectorAll('[data-currency-selector-container]');

    containers.forEach(container => {
        if (!container.querySelector('select')) {
            const selector = createCurrencySelector();
            container.appendChild(selector);
        }
    });
}

// Create currency selector element
function createCurrencySelector() {
    const wrapper = document.createElement('div');
    wrapper.className = 'currency-selector';

    const label = document.createElement('label');
    label.textContent = 'Currency: ';
    label.style.marginRight = '0.5rem';

    const select = document.createElement('select');
    select.setAttribute('data-currency-selector', 'true');

    const currencies = [
        { code: 'INR', name: 'India (₹)' },
        { code: 'USD', name: 'USA ($)' },
        { code: 'EUR', name: 'Europe (€)' },
        { code: 'GBP', name: 'UK (£)' }
    ];

    currencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.code;
        option.textContent = currency.name;
        select.appendChild(option);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);

    // Add event listener
    select.addEventListener('change', (e) => {
        if (window.pricingManager) {
            window.pricingManager.changeCurrency(e.target.value);
        }
    });

    return wrapper;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PricingManager, BASE_PRICES, CURRENCY_SYMBOLS };
}
