// ================================================
// ZELERA - Payment Gateway Integration
// Razorpay, PayPal, and Google Pay support
// ================================================

// Payment gateway configuration
const PAYMENT_CONFIG = {
    razorpay: {
        key: 'rzp_test_S4TiNsqJsf1gSo', // Razorpay Test Key
        keySecret: 'rTCQ1useFcu2yuIQmVH0kvKr', // Test Key Secret (for reference only, not used in frontend)
        name: 'Zelera - BookNest Platform',
        description: 'Premium Book Management Platform',
        image: '/assets/images/logo.png',
        theme: {
            color: '#FFD700'
        }
    },
    paypal: {
        clientId: 'AYlPajZuMhLjIL9YYm8yLtlxCc-3DvlU-PfbhH-BYk2Xp0mWCbnQvScMPlZKsxkihvUaD9goUvHKMfxT',
        currency: 'USD', // Default currency, will be overridden by order currency
        intent: 'capture'
    },
    // Company/Admin Details for Invoice
    company: {
        name: 'Zelera',
        adminName: 'Jerin Jaison',
        email: 'teamzelera@gmail.com',
        phone: '+91 7012783442',
        address: 'India' // Add full address if needed
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
        const proceedBtn = document.getElementById('proceed-payment-btn');

        if (checkoutForm && proceedBtn) {
            // Handle button click
            proceedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Proceed button clicked');
                this.processPayment();
            });

            // Also handle form submit (in case Enter key is pressed)
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Form submitted via Enter key');
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
            {
                amount: plan === 'basic' ? 75000 : (plan === 'standard' ? 100000 : 150000),
                currency: 'INR'
            };

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
            const planNames = {
                'basic': 'Basic Plan',
                'standard': 'Standard Plan',
                'premium': 'Premium Plan'
            };
            planName.textContent = planNames[this.orderData.plan] || 'Unknown Plan';
        }

        if (planPrice) {
            const symbol = window.pricingManager ?
                window.pricingManager.getPriceData(this.orderData.plan).symbol : '₹';
            planPrice.textContent = `${symbol}${this.orderData.amount.toLocaleString()}`;
        }
    }

    async processPayment() {
        console.log('processPayment called');
        console.log('orderData:', this.orderData);

        if (!this.orderData) {
            console.error('No order data found! Redirecting to pricing page.');
            alert('No order data found. Please select a plan from the pricing page first.');
            window.location.href = 'pricing.html';
            return;
        }

        // Get customer data
        const customerData = this.getCustomerData();
        console.log('Validating customer data...');

        // Validate customer data - it will show its own specific error messages
        if (!this.validateCustomerData(customerData)) {
            console.error('Validation failed!');
            // validateCustomerData already showed the specific error message
            return;
        }

        console.log('Validation passed! Proceeding to payment...');

        // Show loading
        this.showPaymentProcessing();

        // Get selected payment method from DOM
        const selectedMethodEl = document.querySelector('.payment-method.selected');
        this.selectedPaymentMethod = selectedMethodEl ? selectedMethodEl.dataset.method : 'razorpay';

        console.log('Selected payment method:', this.selectedPaymentMethod);
        console.log('Order currency:', this.orderData.currency);

        // Validate currency compatibility with payment method
        if (this.selectedPaymentMethod === 'razorpay' && this.orderData.currency !== 'INR') {
            this.hidePaymentProcessing();
            alert('Razorpay is only available for Indian Rupee (INR) payments.\nPlease go back to pricing page and select India (₹) currency.');
            return;
        }

        if (this.selectedPaymentMethod === 'paypal' && this.orderData.currency === 'INR') {
            this.hidePaymentProcessing();
            alert('PayPal is not available for Indian Rupee (INR) payments.\nPlease go back to pricing page and select India (₹) currency to use Razorpay.');
            return;
        }

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
        const nameEl = document.getElementById('customer-name');
        const emailEl = document.getElementById('customer-email');
        const phoneEl = document.getElementById('customer-phone');
        const companyEl = document.getElementById('customer-company');

        const data = {
            name: nameEl && nameEl.value ? nameEl.value.trim() : '',
            email: emailEl && emailEl.value ? emailEl.value.trim() : '',
            phone: phoneEl && phoneEl.value ? phoneEl.value.trim() : '',
            company: companyEl && companyEl.value ? companyEl.value.trim() : ''
        };

        console.log('Customer data collected:', data);
        return data;
    }

    validateCustomerData(data) {
        console.log('validateCustomerData called with:', data);

        // Check if all required fields are filled
        if (!data.name || data.name.trim() === '') {
            console.error('Name validation failed');
            if (window.showNotification) {
                window.showNotification('Please enter your full name', 'error');
            } else {
                alert('Please enter your full name');
            }
            document.getElementById('customer-name')?.focus();
            return false;
        }

        if (!data.email || data.email.trim() === '') {
            console.error('Email empty validation failed');
            if (window.showNotification) {
                window.showNotification('Please enter your email address', 'error');
            } else {
                alert('Please enter your email address');
            }
            document.getElementById('customer-email')?.focus();
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            console.error('Email format validation failed');
            if (window.showNotification) {
                window.showNotification('Please enter a valid email address', 'error');
            } else {
                alert('Please enter a valid email address');
            }
            document.getElementById('customer-email')?.focus();
            return false;
        }

        if (!data.phone || data.phone.trim() === '') {
            console.error('Phone validation failed');
            if (window.showNotification) {
                window.showNotification('Please enter your phone number', 'error');
            } else {
                alert('Please enter your phone number');
            }
            document.getElementById('customer-phone')?.focus();
            return false;
        }

        // Validate phone format (at least 10 digits)
        const phoneDigits = data.phone.replace(/\D/g, '');

        // Special validation for Indian numbers when currency is INR
        if (this.orderData && this.orderData.currency === 'INR') {
            // Indian mobile numbers: 10 digits starting with 6-9
            if (phoneDigits.length !== 10) {
                console.error('Indian phone validation failed - not 10 digits');
                if (window.showNotification) {
                    window.showNotification('Please enter a valid Indian phone number (10 digits)', 'error');
                } else {
                    alert('Please enter a valid Indian phone number (10 digits)');
                }
                document.getElementById('customer-phone')?.focus();
                return false;
            }

            const firstDigit = phoneDigits[0];
            if (firstDigit < '6' || firstDigit > '9') {
                console.error('Indian phone validation failed - invalid starting digit');
                if (window.showNotification) {
                    window.showNotification('Indian mobile numbers must start with 6, 7, 8, or 9', 'error');
                } else {
                    alert('Indian mobile numbers must start with 6, 7, 8, or 9');
                }
                document.getElementById('customer-phone')?.focus();
                return false;
            }
        } else {
            // General validation for other countries (at least 10 digits)
            if (phoneDigits.length < 10) {
                console.error('Phone length validation failed');
                if (window.showNotification) {
                    window.showNotification('Please enter a valid phone number (at least 10 digits)', 'error');
                } else {
                    alert('Please enter a valid phone number (at least 10 digits)');
                }
                document.getElementById('customer-phone')?.focus();
                return false;
            }
        }

        console.log('All validations passed!');
        return true;
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
                    window.showNotification('Payment cancelled. You can try again.', 'error');
                },
                onhidden: () => {
                    this.hidePaymentProcessing();
                }
            }
        };

        // Add error handler
        options.handler.onerror = (error) => {
            this.handlePaymentFailure(error, customerData);
        };

        try {
            const rzp = new Razorpay(options);

            // Handle payment failure
            rzp.on('payment.failed', (response) => {
                this.handlePaymentFailure(response.error, customerData);
            });

            rzp.open();
            this.hidePaymentProcessing();
        } catch (error) {
            this.hidePaymentProcessing();
            window.showNotification('Failed to open payment gateway. Please try again.', 'error');
            console.error('Razorpay error:', error);
        }
    }

    async processPayPal(customerData) {
        try {
            console.log('Processing PayPal payment...');

            // Check if PayPal SDK is loaded
            if (typeof paypal === 'undefined') {
                console.error('PayPal SDK not loaded');
                this.hidePaymentProcessing();
                alert('PayPal is not loaded. Please refresh the page and try again.');
                return;
            }

            // Hide the processing overlay
            this.hidePaymentProcessing();

            // Create PayPal button container if doesn't exist
            let paypalContainer = document.getElementById('paypal-button-container');
            if (!paypalContainer) {
                // Create overlay
                const overlay = document.createElement('div');
                overlay.id = 'paypal-overlay';
                overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center;';

                // Create modal
                const modal = document.createElement('div');
                modal.id = 'paypal-modal';
                modal.style.cssText = 'background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-width: 500px; width: 90%;';

                // Add title
                const title = document.createElement('h3');
                title.textContent = 'Complete Payment with PayPal';
                title.style.cssText = 'margin-top: 0; color: #333;';
                modal.appendChild(title);

                // Create button container
                paypalContainer = document.createElement('div');
                paypalContainer.id = 'paypal-button-container';
                paypalContainer.style.cssText = 'margin: 1rem 0;';
                modal.appendChild(paypalContainer);

                // Add close button
                const closeBtn = document.createElement('button');
                closeBtn.textContent = 'Cancel';
                closeBtn.style.cssText = 'width: 100%; padding: 0.75rem; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 1rem;';
                closeBtn.onclick = () => overlay.remove();
                modal.appendChild(closeBtn);

                overlay.appendChild(modal);
                document.body.appendChild(overlay);
            }

            // Render PayPal buttons
            paypal.Buttons({
                style: {
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'paypal'
                },
                createOrder: (data, actions) => {
                    console.log('Creating PayPal order...');
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                currency_code: this.orderData.currency,
                                value: this.orderData.amount.toFixed(2)
                            },
                            description: `${this.selectedPlan.toUpperCase()} Plan - Zelera BookNest Platform`
                        }],
                        application_context: {
                            brand_name: 'Zelera BookNest',
                            shipping_preference: 'NO_SHIPPING'
                        }
                    });
                },
                onApprove: async (data, actions) => {
                    try {
                        console.log('PayPal order approved, capturing...');
                        const order = await actions.order.capture();
                        console.log('PayPal payment successful:', order);

                        // Remove PayPal overlay
                        document.getElementById('paypal-overlay')?.remove();

                        // Format response for our success handler
                        const response = {
                            paymentId: order.id,
                            orderId: this.generateOrderId(),
                            status: order.status
                        };

                        await this.handlePaymentSuccess(response, customerData);
                    } catch (error) {
                        console.error('Error capturing PayPal order:', error);
                        document.getElementById('paypal-overlay')?.remove();
                        this.handlePaymentFailure(error, customerData);
                    }
                },
                onCancel: (data) => {
                    console.log('PayPal payment cancelled by user');
                    document.getElementById('paypal-overlay')?.remove();
                    if (window.showNotification) {
                        window.showNotification('Payment cancelled. You can try again.', 'error');
                    } else {
                        alert('Payment cancelled. You can try again.');
                    }
                },
                onError: (err) => {
                    console.error('PayPal error:', err);
                    document.getElementById('paypal-overlay')?.remove();
                    this.handlePaymentFailure(err, customerData);
                }
            }).render('#paypal-button-container');

        } catch (error) {
            console.error('PayPal processing error:', error);
            this.hidePaymentProcessing();
            alert('Failed to initialize PayPal. Please try again.');
        }
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

    handlePaymentFailure(error, customerData) {
        this.hidePaymentProcessing();

        console.error('Payment failed:', error);

        // Show user-friendly error message
        let errorMessage = 'Payment failed. Please try again.';

        if (error.description) {
            errorMessage = error.description;
        } else if (error.reason) {
            errorMessage = error.reason;
        } else if (error.message) {
            errorMessage = error.message;
        }

        window.showNotification(errorMessage, 'error');

        // Store failed attempt for retry
        const failedAttempt = {
            customerData: customerData,
            error: errorMessage,
            timestamp: new Date().toISOString()
        };

        sessionStorage.setItem('failedPayment', JSON.stringify(failedAttempt));
    }

    async handlePaymentSuccess(response, customerData) {
        // Hide any processing overlays
        this.hidePaymentProcessing();

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

        // Create one-time access token for success page
        sessionStorage.setItem('paymentSuccessToken', orderDetails.orderId);

        // Clear session storage
        sessionStorage.removeItem('orderData');
        sessionStorage.removeItem('failedPayment');

        // Send confirmation email
        if (window.emailService) {
            try {
                await window.emailService.sendOrderConfirmation(orderDetails);
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Don't block success flow if email fails
            }
        }

        // Show success animation
        this.showSuccessAnimation();

        // Redirect to success page after animation
        setTimeout(() => {
            window.location.replace('success.html'); // Use replace to prevent back button
        }, 3000);
    }

    // Generate and download invoice
    generateInvoice(orderDetails) {
        // This method will be called from success.html
        // Using jsPDF library
        if (typeof jspdf === 'undefined' || !jspdf.jsPDF) {
            console.error('jsPDF library not loaded');
            alert('Invoice generation library not available. Please contact support.');
            return;
        }

        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        // Company/Admin Details
        const company = PAYMENT_CONFIG.company;

        // Page dimensions
        const pageWidth = doc.internal.pageSize.width;

        // Add Company Header with Gold Accent
        doc.setFillColor(255, 215, 0); // Gold
        doc.rect(0, 0, pageWidth, 35, 'F');

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text(company.name.toUpperCase(), 15, 15);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('BookNest Platform - Premium Book Management Solution', 15, 22);
        doc.text(`Admin: ${company.adminName}`, 15, 28);

        // Invoice Title
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('INVOICE', pageWidth - 15, 15, { align: 'right' });

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(`Invoice #: ${orderDetails.orderId}`, pageWidth - 15, 22, { align: 'right' });

        const invoiceDate = new Date(orderDetails.timestamp);
        doc.text(`Date: ${invoiceDate.toLocaleDateString('en-IN')}`, pageWidth - 15, 28, { align: 'right' });

        // Company Contact Details (Left Column)
        let yPos = 45;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('FROM:', 15, yPos);

        yPos += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(company.name, 15, yPos);

        yPos += 5;
        doc.setFont(undefined, 'normal');
        doc.text(`Admin: ${company.adminName}`, 15, yPos);

        yPos += 5;
        doc.text(`Email: ${company.email}`, 15, yPos);

        yPos += 5;
        doc.text(`Phone: ${company.phone}`, 15, yPos);

        yPos += 5;
        doc.text(`Location: ${company.address}`, 15, yPos);

        // Customer Details (Right Column)
        yPos = 45;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('BILL TO:', pageWidth - 15, yPos, { align: 'right' });

        yPos += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(orderDetails.customer.name, pageWidth - 15, yPos, { align: 'right' });

        yPos += 5;
        doc.setFont(undefined, 'normal');
        if (orderDetails.customer.company) {
            doc.text(orderDetails.customer.company, pageWidth - 15, yPos, { align: 'right' });
            yPos += 5;
        }
        doc.text(orderDetails.customer.email, pageWidth - 15, yPos, { align: 'right' });

        yPos += 5;
        doc.text(orderDetails.customer.phone, pageWidth - 15, yPos, { align: 'right' });

        // Payment Information Section
        yPos = Math.max(yPos, 75) + 10;
        doc.setDrawColor(255, 215, 0);
        doc.setLineWidth(0.5);
        doc.line(15, yPos, pageWidth - 15, yPos);

        yPos += 10;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Payment Details', 15, yPos);

        yPos += 8;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Payment ID: ${orderDetails.paymentId}`, 15, yPos);

        yPos += 5;
        doc.text(`Payment Date: ${invoiceDate.toLocaleString('en-IN')}`, 15, yPos);

        yPos += 5;
        doc.text(`Payment Status: ${orderDetails.status.toUpperCase()}`, 15, yPos);

        // Invoice Items Table
        yPos += 15;
        doc.setDrawColor(255, 215, 0);
        doc.setLineWidth(0.5);
        doc.line(15, yPos, pageWidth - 15, yPos);

        // Table Header
        yPos += 8;
        doc.setFillColor(255, 215, 0);
        doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');

        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text('Description', 20, yPos);
        doc.text('Plan', 120, yPos);
        doc.text('Amount', pageWidth - 20, yPos, { align: 'right' });

        // Table Content
        yPos += 10;
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        const planNames = {
            'basic': 'Basic Plan',
            'standard': 'Standard Plan',
            'premium': 'Premium Plan'
        };
        const planName = planNames[orderDetails.plan] || 'Premium Plan';

        doc.text('BookNest Platform License', 20, yPos);
        doc.text(planName, 120, yPos);

        const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£' };
        const symbol = symbols[orderDetails.currency] || '₹';
        doc.text(`${symbol}${orderDetails.amount.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });

        // Divider
        yPos += 7;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(15, yPos, pageWidth - 15, yPos);

        // Total Section
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('TOTAL PAID:', pageWidth - 80, yPos);

        doc.setFontSize(14);
        doc.setTextColor(255, 215, 0);
        doc.text(`${symbol}${orderDetails.amount.toLocaleString()}`, pageWidth - 20, yPos, { align: 'right' });

        // Payment Success Stamp - Centered
        yPos += 15;

        // PAID stamp styling
        doc.setDrawColor(34, 197, 94); // Green border
        doc.setLineWidth(3);
        doc.setTextColor(34, 197, 94); // Green text
        doc.setFontSize(40);
        doc.setFont(undefined, 'bold');

        // Center the stamp on the page
        const stampWidth = 60;
        const stampHeight = 20;
        const stampX = (pageWidth - stampWidth) / 2; // Center horizontally

        // Draw rectangle border
        doc.rect(stampX, yPos, stampWidth, stampHeight);

        // Draw centered text
        doc.text('PAID', pageWidth / 2, yPos + 13, { align: 'center' });

        // Reset color for footer
        doc.setTextColor(0, 0, 0);
        yPos = doc.internal.pageSize.height - 50;
        doc.setDrawColor(255, 215, 0);
        doc.setLineWidth(0.5);
        doc.line(15, yPos, pageWidth - 15, yPos);

        yPos += 8;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Thank you for your purchase!', 15, yPos);

        yPos += 6;
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('You will receive download links and installation instructions via email within 24 hours.', 15, yPos);

        yPos += 5;
        doc.text('For support, contact us at:', 15, yPos);

        yPos += 5;
        doc.text(`Email: ${company.email} | Phone: ${company.phone}`, 15, yPos);

        yPos += 10;
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 15, yPos);
        doc.text('This is a computer-generated invoice', pageWidth - 15, yPos, { align: 'right' });

        // Save the PDF
        doc.save(`Zelera-Invoice-${orderDetails.orderId}.pdf`);
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
