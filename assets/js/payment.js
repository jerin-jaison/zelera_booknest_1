// ================================================
// ZELERA - Payment Gateway Integration
// Razorpay, PayPal, and Google Pay support
// ================================================

// Payment gateway configuration
const PAYMENT_CONFIG = {
    razorpay: {
        key: 'rzp_test_YOUR_KEY_HERE', // Replace with actual Razorpay key
        name: 'Zelera - BookNest Platform',
        description: 'Premium Book Management Platform',
        image: '/assets/images/logo.png',
        theme: {
            color: '#FFD700'
        }
    },
    paypal: {
        clientId: 'YOUR_PAYPAL_CLIENT_ID', // Replace with actual PayPal client ID
        currency: 'USD'
    }
};

class PaymentManager {
    constructor() {
        this.selectedPlan = null;
        this.selectedPaymentMethod = 'razorpay';
        this.orderData = null;
        this.init();
    }

    init() {
        this.loadPaymentScripts();
        this.setupEventListeners();
        this.loadOrderData();
    }

    loadPaymentScripts() {
        // Load Razorpay script
        if (!document.getElementById('razorpay-script')) {
            const razorpayScript = document.createElement('script');
            razorpayScript.id = 'razorpay-script';
            razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
            razorpayScript.async = true;
            document.head.appendChild(razorpayScript);
        }

        // Load PayPal script
        if (!document.getElementById('paypal-script') && PAYMENT_CONFIG.paypal.clientId !== 'YOUR_PAYPAL_CLIENT_ID') {
            const paypalScript = document.createElement('script');
            paypalScript.id = 'paypal-script';
            paypalScript.src = `https://www.paypal.com/sdk/js?client-id=${PAYMENT_CONFIG.paypal.clientId}&currency=USD`;
            paypalScript.async = true;
            document.head.appendChild(paypalScript);
        }
    }

    setupEventListeners() {
        // Payment method selection
        const paymentMethods = document.querySelectorAll('.payment-method');
        paymentMethods.forEach(method => {
            method.addEventListener('click', () => {
                this.selectPaymentMethod(method.dataset.method);
            });
        });

        // Buy Now buttons
        const buyButtons = document.querySelectorAll('[data-buy-plan]');
        buyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const plan = button.dataset.buyPlan;
                this.initiatePurchase(plan);
            });
        });

        // Checkout form submission
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPayment();
            });
        }
    }

    selectPaymentMethod(method) {
        this.selectedPaymentMethod = method;

        // Update UI
        const methods = document.querySelectorAll('.payment-method');
        methods.forEach(m => m.classList.remove('selected'));

        const selected = document.querySelector(`[data-method="${method}"]`);
        if (selected) {
            selected.classList.add('selected');
        }
    }

    initiatePurchase(plan) {
        this.selectedPlan = plan;

        // Get price data from pricing manager
        const priceData = window.pricingManager ?
            window.pricingManager.getPriceData(plan) :
            { amount: plan === 'standard' ? 75000 : 100000, currency: 'INR' };

        // Store order data
        this.orderData = {
            plan: plan,
            amount: priceData.amount,
            currency: priceData.currency,
            timestamp: new Date().toISOString()
        };

        // Save to sessionStorage
        sessionStorage.setItem('orderData', JSON.stringify(this.orderData));

        // Redirect to checkout page
        window.location.href = 'checkout.html';
    }

    loadOrderData() {
        const stored = sessionStorage.getItem('orderData');
        if (stored) {
            this.orderData = JSON.parse(stored);
            this.selectedPlan = this.orderData.plan;
            this.populateCheckoutForm();
        }
    }

    populateCheckoutForm() {
        if (!this.orderData) return;

        // Update order summary
        const planName = document.getElementById('order-plan-name');
        const planPrice = document.getElementById('order-plan-price');

        if (planName) {
            planName.textContent = this.orderData.plan === 'standard' ? 'Standard Plan' : 'Premium Plan';
        }

        if (planPrice) {
            const symbol = window.pricingManager ?
                window.pricingManager.getPriceData(this.orderData.plan).symbol : '₹';
            planPrice.textContent = `${symbol}${this.orderData.amount.toLocaleString()}`;
        }
    }

    async processPayment() {
        if (!this.orderData) {
            window.showNotification('No order data found. Please select a plan first.', 'error');
            return;
        }

        // Get customer data
        const customerData = this.getCustomerData();

        // Validate customer data
        if (!this.validateCustomerData(customerData)) {
            window.showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Show loading
        this.showPaymentProcessing();

        // Process based on selected payment method
        switch (this.selectedPaymentMethod) {
            case 'razorpay':
                await this.processRazorpay(customerData);
                break;
            case 'paypal':
                await this.processPayPal(customerData);
                break;
            case 'gpay':
                await this.processGooglePay(customerData);
                break;
            default:
                this.hidePaymentProcessing();
                window.showNotification('Please select a payment method', 'error');
        }
    }

    getCustomerData() {
        return {
            name: document.getElementById('customer-name')?.value || '',
            email: document.getElementById('customer-email')?.value || '',
            phone: document.getElementById('customer-phone')?.value || '',
            company: document.getElementById('customer-company')?.value || ''
        };
    }

    validateCustomerData(data) {
        return data.name && data.email && data.phone;
    }

    async processRazorpay(customerData) {
        if (typeof Razorpay === 'undefined') {
            this.hidePaymentProcessing();
            window.showNotification('Razorpay is not loaded. Please refresh and try again.', 'error');
            return;
        }

        const options = {
            key: PAYMENT_CONFIG.razorpay.key,
            amount: this.orderData.amount * 100, // Razorpay expects amount in paise
            currency: this.orderData.currency,
            name: PAYMENT_CONFIG.razorpay.name,
            description: `${this.selectedPlan.charAt(0).toUpperCase() + this.selectedPlan.slice(1)} Plan`,
            image: PAYMENT_CONFIG.razorpay.image,
            prefill: {
                name: customerData.name,
                email: customerData.email,
                contact: customerData.phone
            },
            theme: PAYMENT_CONFIG.razorpay.theme,
            handler: (response) => {
                this.handlePaymentSuccess(response, customerData);
            },
            modal: {
                ondismiss: () => {
                    this.hidePaymentProcessing();
                    window.showNotification('Payment cancelled', 'error');
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
        this.hidePaymentProcessing();
    }

    async processPayPal(customerData) {
        // PayPal integration would require server-side setup
        // This is a simplified client-side demonstration

        this.hidePaymentProcessing();

        // Simulate PayPal payment for demo
        setTimeout(() => {
            const mockResponse = {
                paymentId: 'PAYPAL_' + Date.now(),
                status: 'success'
            };
            this.handlePaymentSuccess(mockResponse, customerData);
        }, 2000);
    }

    async processGooglePay(customerData) {
        // Google Pay integration
        // For Indian users, this would go through Razorpay
        // For international, use Google Pay Web API

        if (this.orderData.currency === 'INR') {
            // Use Razorpay with GPay option
            await this.processRazorpay(customerData);
        } else {
            this.hidePaymentProcessing();
            window.showNotification('Google Pay is currently available for Indian customers only', 'error');
        }
    }

    async handlePaymentSuccess(response, customerData) {
        // Store order details
        const orderDetails = {
            orderId: this.generateOrderId(),
            paymentId: response.razorpay_payment_id || response.paymentId,
            plan: this.selectedPlan,
            amount: this.orderData.amount,
            currency: this.orderData.currency,
            customer: customerData,
            timestamp: new Date().toISOString(),
            status: 'success'
        };

        // Save to localStorage
        localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

        // Clear session storage
        sessionStorage.removeItem('orderData');

        // Send confirmation email
        if (window.emailService) {
            await window.emailService.sendOrderConfirmation(orderDetails);
        }

        // Show success animation
        this.showSuccessAnimation();

        // Redirect to success page after animation
        setTimeout(() => {
            window.location.href = 'success.html';
        }, 3000);
    }

    showPaymentProcessing() {
        let overlay = document.querySelector('.payment-processing');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'payment-processing';
            overlay.innerHTML = `
        <div class="payment-loader"></div>
        <div class="payment-message">Processing your payment...</div>
      `;
            document.body.appendChild(overlay);
        }

        overlay.classList.add('active');
    }

    hidePaymentProcessing() {
        const overlay = document.querySelector('.payment-processing');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    showSuccessAnimation() {
        let animation = document.querySelector('.success-animation');

        if (!animation) {
            animation = document.createElement('div');
            animation.className = 'success-animation';
            animation.innerHTML = `
        <div class="success-checkmark"></div>
        <div class="success-message">Payment Successful!</div>
        <div class="success-submessage">Redirecting to confirmation page...</div>
      `;
            document.body.appendChild(animation);
        }

        animation.classList.add('active');

        // Add confetti
        this.createConfetti();
    }

    createConfetti() {
        const colors = ['#FFD700', '#00D9FF', '#8B5CF6', '#D946EF'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';

            document.body.appendChild(confetti);

            // Remove after animation
            setTimeout(() => confetti.remove(), 5000);
        }
    }

    generateOrderId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `ZEL${timestamp}${random}`;
    }
}

// Initialize payment manager
let paymentManager;

document.addEventListener('DOMContentLoaded', function () {
    paymentManager = new PaymentManager();
    window.paymentManager = paymentManager;
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PaymentManager };
}
