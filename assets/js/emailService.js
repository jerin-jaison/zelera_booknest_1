// ================================================
// ZELERA - Email Service
// Automated email delivery for order confirmations
// ================================================

// EmailJS Configuration
// Sign up at https://www.emailjs.com/ to get your credentials
const EMAILJS_CONFIG = {
  serviceId: 'YOUR_SERVICE_ID',
  templateId: 'YOUR_TEMPLATE_ID',
  publicKey: 'YOUR_PUBLIC_KEY'
};

class EmailService {
  constructor() {
    this.initialized = false;
    this.init();
  }

  init() {
    this.loadEmailJS();
  }

  loadEmailJS() {
    // Load EmailJS SDK
    if (!document.getElementById('emailjs-script')) {
      const script = document.createElement('script');
      script.id = 'emailjs-script';
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.async = true;
      script.onload = () => {
        this.initializeEmailJS();
      };
      document.head.appendChild(script);
    }
  }

  initializeEmailJS() {
    if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY') {
      emailjs.init(EMAILJS_CONFIG.publicKey);
      this.initialized = true;
      console.log('EmailJS initialized successfully');
    } else {
      console.warn('EmailJS not configured. Please set up EmailJS credentials in emailService.js');
    }
  }

  async sendOrderConfirmation(orderDetails) {
    if (!this.initialized) {
      console.warn('EmailJS not initialized. Email not sent.');
      // For demo purposes, simulate email sending
      return this.simulateEmailSend(orderDetails);
    }

    try {
      const templateParams = this.prepareOrderConfirmationTemplate(orderDetails);

      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      console.log('Order confirmation email sent successfully:', response);
      return { success: true, response };

    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }
  }

  async sendContactQuery(contactDetails) {
    if (!this.initialized) {
      console.warn('EmailJS not initialized. Message not sent.');
      return { success: true, simulated: true };
    }

    try {
      // Map form fields to template params
      // Make sure your EmailJS template has these variables:
      // from_name, from_email, phone, subject, message, reply_to
      const templateParams = {
        from_name: contactDetails.name,
        from_email: contactDetails.email,
        phone: contactDetails.phone,
        subject: contactDetails.subject,
        message: contactDetails.message,
        reply_to: contactDetails.email,
        to_email: 'teamzelera@gmail.com'
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId, // using the same template ID or you can add a separate one for contact
        templateParams
      );

      console.log('Contact query sent successfully:', response);
      return { success: true, response };

    } catch (error) {
      console.error('Failed to send contact query:', error);
      return { success: false, error };
    }
  }

  prepareOrderConfirmationTemplate(orderDetails) {
    const planNames = {
      'basic': 'Basic Plan',
      'standard': 'Standard Plan',
      'premium': 'Premium Plan'
    };
    const planName = planNames[orderDetails.plan] || orderDetails.plan;
    const currency = orderDetails.currency || 'INR';
    const symbol = this.getCurrencySymbol(currency);

    return {
      to_name: orderDetails.customer.name,
      to_email: orderDetails.customer.email,
      order_id: orderDetails.orderId,
      plan_name: planName,
      amount: `${symbol}${orderDetails.amount.toLocaleString()}`,
      payment_id: orderDetails.paymentId,
      company: orderDetails.customer.company || 'N/A',
      phone: orderDetails.customer.phone,
      order_date: new Date(orderDetails.timestamp).toLocaleDateString(),
      // Product delivery information
      product_name: 'BookNest - Premium Book Management Platform',
      download_link: this.generateDownloadLink(orderDetails),
      access_credentials: this.generateAccessCredentials(orderDetails),
      support_email: 'teamzelera@gmail.com',
      support_phone: '+91 7012783442'
    };
  }

  generateDownloadLink(orderDetails) {
    // In production, this would be a real download link from your server
    // For demo, generate a placeholder
    return `https://zelera.com/download/${orderDetails.orderId}`;
  }

  generateAccessCredentials(orderDetails) {
    // In production, generate real credentials
    // For demo, create placeholder
    return {
      username: orderDetails.customer.email,
      password: 'Will be sent separately',
      portalUrl: 'https://portal.zelera.com'
    };
  }

  getCurrencySymbol(currency) {
    const symbols = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  }

  async simulateEmailSend(orderDetails) {
    // Simulate email sending for demo purposes
    console.log('=== SIMULATED EMAIL ===');
    console.log('Sending order confirmation email to:', orderDetails.customer.email);
    console.log('Order ID:', orderDetails.orderId);
    console.log('Plan:', orderDetails.plan);
    console.log('Amount:', orderDetails.amount, orderDetails.currency);
    console.log('======================');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { success: true, simulated: true };
  }

  // Email template for manual reference
  getEmailTemplate(orderDetails) {
    const planNames = {
      'basic': 'Basic Plan',
      'standard': 'Standard Plan',
      'premium': 'Premium Plan'
    };
    const planName = planNames[orderDetails.plan] || orderDetails.plan;
    const symbol = this.getCurrencySymbol(orderDetails.currency);

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #FFD700, #00D9FF); padding: 40px; text-align: center; }
    .header h1 { color: #000; margin: 0; font-size: 32px; }
    .content { padding: 30px; background: #f9f9f9; }
    .order-details { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .order-details table { width: 100%; }
    .order-details td { padding: 10px; border-bottom: 1px solid #eee; }
    .order-details td:first-child { font-weight: bold; }
    .cta-button { display: inline-block; padding: 15px 30px; background: #FFD700; color: #000; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
    </div>
    
    <div class="content">
      <h2>Thank you for your purchase, ${orderDetails.customer.name}!</h2>
      <p>Your order for <strong>${planName}</strong> has been successfully processed.</p>
      
      <div class="order-details">
        <h3>Order Details</h3>
        <table>
          <tr>
            <td>Order ID:</td>
            <td>${orderDetails.orderId}</td>
          </tr>
          <tr>
            <td>Plan:</td>
            <td>${planName}</td>
          </tr>
          <tr>
            <td>Amount Paid:</td>
            <td>${symbol}${orderDetails.amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Payment ID:</td>
            <td>${orderDetails.paymentId}</td>
          </tr>
          <tr>
            <td>Date:</td>
            <td>${new Date(orderDetails.timestamp).toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <h3>Next Steps:</h3>
      <ol>
        <li>Download your BookNest platform package</li>
        <li>Follow the installation guide</li>
        <li>Access your admin dashboard</li>
        <li>Contact our support team for assistance</li>
      </ol>
      
      <center>
        <a href="${this.generateDownloadLink(orderDetails)}" class="cta-button">Download BookNest</a>
      </center>
      
      <h3>Access Credentials:</h3>
      <p>Your access credentials will be sent in a separate email within 24 hours.</p>
      
      <h3>Support:</h3>
      <p>If you have any questions, please contact us at:</p>
      <ul>
        <li>Email: teamzelera@gmail.com</li>
        <li>Phone: +91 7012783442</li>
        <li>Portal: <a href="https://portal.zelera.com">portal.zelera.com</a></li>
      </ul>
    </div>
    
    <div class="footer">
      <p>&copy; 2026 Zelera - BookNest Platform. All rights reserved.</p>
      <p>Enterprise-grade solution for serious businesses.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Admin notification email
  async sendAdminNotification(orderDetails) {
    console.log('=== ADMIN NOTIFICATION ===');
    console.log('New order received:');
    console.log('Customer:', orderDetails.customer.name, '(' + orderDetails.customer.email + ')');
    console.log('Plan:', orderDetails.plan);
    console.log('Amount:', orderDetails.amount, orderDetails.currency);
    console.log('Order ID:', orderDetails.orderId);
    console.log('========================');

    // In production, send actual email to admin
    return { success: true };
  }
}

// Initialize email service
let emailService;

document.addEventListener('DOMContentLoaded', function () {
  emailService = new EmailService();
  window.emailService = emailService;
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EmailService };
}
