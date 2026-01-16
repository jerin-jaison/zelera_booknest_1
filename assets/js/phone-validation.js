// Real-time phone input validation and formatting
document.addEventListener('DOMContentLoaded', function () {
    const phoneInput = document.getElementById('customer-phone');

    if (phoneInput) {
        // Enforce numeric input only and max 10 digits
        phoneInput.addEventListener('input', function (e) {
            // Remove all non-numeric characters
            let value = this.value.replace(/\D/g, '');

            // Limit to 10 digits
            if (value.length > 10) {
                value = value.substring(0, 10);
            }

            this.value = value;

            // Visual feedback for Indian numbers
            const orderData = sessionStorage.getItem('orderData');
            if (orderData) {
                const data = JSON.parse(orderData);
                if (data.currency === 'INR' && value.length > 0) {
                    const firstDigit = value[0];

                    // Highlight field if doesn't start with 6-9
                    if (firstDigit < '6' || firstDigit > '9') {
                        this.style.borderColor = '#EF4444'; // Red
                        this.style.borderWidth = '2px';
                    } else if (value.length === 10) {
                        this.style.borderColor = '#10B981'; // Green
                        this.style.borderWidth = '2px';
                    } else {
                        this.style.borderColor = '';
                        this.style.borderWidth = '';
                    }
                }
            }
        });

        // Prevent non-numeric input
        phoneInput.addEventListener('keypress', function (e) {
            // Allow only numbers
            if (e.which < 48 || e.which > 57) {
                e.preventDefault();
            }
        });

        // Prevent paste of non-numeric content
        phoneInput.addEventListener('paste', function (e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const numericOnly = pastedText.replace(/\D/g, '').substring(0, 10);
            this.value = numericOnly;

            // Trigger input event for validation
            const event = new Event('input', { bubbles: true });
            this.dispatchEvent(event);
        });
    }
});
