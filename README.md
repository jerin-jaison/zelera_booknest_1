# ZELERA - Premium BookNest Sales Website

A high-converting, enterprise-grade sales website for Zelera's BookNest platform. Built with Bootstrap 5, featuring dark luxury design, multi-currency support, integrated payment gateways, and premium animations.

## 🎯 Features

### ✨ Design & User Experience
- **Dark Luxury Theme**: Premium black, charcoal, and deep gray color scheme
- **Accent Colors**: Gold, neon blue, and purple gradients
- **Smooth Animations**: Scroll-triggered animations, hover effects, and micro-interactions
- **Glassmorphism Effects**: Modern UI elements with backdrop blur
- **Fully Responsive**: Perfect on mobile, tablet, and desktop

### 💰 Payment Integration
- **Razorpay**: UPI, cards, net banking, wallets (Primary for India)
- **PayPal**: International payments with smart buttons
- **Google Pay**: Quick and secure payments
- **Multi-Currency Support**: INR, USD, EUR, GBP with automatic conversion

### 🌍 Dynamic Pricing
- Country-based currency detection
- Real-time price conversion
- LocalStorage persistence
- Currency selector on pricing and checkout pages

### 📧 Email Delivery
- EmailJS integration for order confirmations
- Product delivery via email after payment
- Automated order notifications
- Beautiful HTML email templates

### 📄 Pages

1. **Home (index.html)**: Hero section, features, trust badges, testimonials
2. **Features (features.html)**: Detailed feature showcase with animations
3. **Pricing (pricing.html)**: Two plans (₹75K/₹1L) with comparison table
4. **Why BookNest (why-booknest.html)**: Before/after comparison, ROI calculator
5. **About (about.html)**: Company story, mission, vision, values
6. **Contact (contact.html)**: Contact form, multiple contact methods
7. **Checkout (checkout.html)**: Payment processing with gateway selection
8. **Success (success.html)**: Order confirmation with animated checkmark

## 🚀 Technology Stack

- **Framework**: Bootstrap 5.3.2
- **Icons**: Font Awesome 6.5.1
- **Fonts**: Inter, Outfit (Google Fonts)
- **JavaScript**: Vanilla JS (ES6+)
- **Payment**: Razorpay SDK, PayPal SDK
- **Email**: EmailJS (optional)

## 📁 Project Structure

```
zel-1/
├── index.html              # Home page
├── features.html           # Features showcase
├── pricing.html            # Pricing plans
├── why-booknest.html       # Value proposition
├── about.html              # About company
├── contact.html            # Contact page
├── checkout.html           # Payment checkout
├── success.html            # Success confirmation
├── assets/
│   ├── css/
│   │   ├── style.css       # Main stylesheet
│   │   └── animations.css  # Animation library
│   ├── js/
│   │   ├── main.js         # Core functionality
│   │   ├── pricing.js      # Dynamic pricing
│   │   ├── payment.js      # Payment gateways
│   │   └── emailService.js # Email delivery
│   └── images/             # Image assets (to be added)
└── README.md              # This file
```

## ⚙️ Setup & Configuration

### 1. Payment Gateway Configuration

**Razorpay** (Edit `assets/js/payment.js`):
```javascript
razorpay: {
  key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your key
  // ...
}
```

**PayPal** (Edit `assets/js/payment.js`):
```javascript
paypal: {
  clientId: 'YOUR_PAYPAL_CLIENT_ID', // Replace with your client ID
  // ...
}
```

### 2. Email Service Configuration

**EmailJS** (Edit `assets/js/emailService.js`):
```javascript
const EMAILJS_CONFIG = {
  serviceId: 'YOUR_SERVICE_ID',
  templateId: 'YOUR_TEMPLATE_ID',
  publicKey: 'YOUR_PUBLIC_KEY'
};
```

Sign up at [EmailJS](https://www.emailjs.com/) to get credentials.

### 3. Currency Rates

Update exchange rates in `assets/js/pricing.js` as needed:
```javascript
const EXCHANGE_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095
};
```

## 🎨 Customization

### Colors

Edit CSS variables in `assets/css/style.css`:
```css
:root {
  --color-gold: #FFD700;
  --color-neon-blue: #00D9FF;
  --color-purple: #8B5CF6;
  /* ... */
}
```

### Pricing

Update base prices in `assets/js/pricing.js`:
```javascript
const BASE_PRICES = {
  standard: 75000,  // ₹75,000
  premium: 100000   // ₹1,00,000
};
```

### Contact Information

Search and replace placeholder contact details:
- Email: `support@zelera.com`
- Phone: `+91-XXXXX-XXXXX`
- WhatsApp: Update link in contact.html

## 🚀 Deployment

### Local Development

1. No build process required - open `index.html` directly in browser
2. Or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js http-server
   npx http-server
   ```

### Production Deployment

1. **Set up payment gateways** with production credentials
2. **Configure EmailJS** for email delivery
3. **Add real images** to `assets/images/`
4. **Update contact information** across all pages
5. **Test all payment flows** thoroughly
6. Deploy to:
   - GitHub Pages
   - Netlify
   - Vercel
   - Any static hosting service

## 📋 Pre-Launch Checklist

- [ ] Replace Razorpay test key with production key
- [ ] Set up PayPal production credentials
- [ ] Configure EmailJS with real templates
- [ ] Add company logo and images
- [ ] Update all contact information
- [ ] Test payment flows in all currencies
- [ ] Verify responsive design on all devices
- [ ] Check all internal links
- [ ] Test form submissions
- [ ] Set up analytics (Google Analytics, etc.)
- [ ] Add favicon
- [ ] Set up custom domain
- [ ] SSL certificate configuration

## 🎯 Key Features for Conversion

1. **Multiple CTAs**: Buy Now buttons on every page
2. **Sticky Navbar**: Always-visible purchase option
3. **Social Proof**: Testimonials and trust badges
4. **Urgency**: "Most Popular" badge on Premium plan
5. **Clear Value**: Before/After comparisons
6. **Risk Reversal**: 7-day money-back guarantee
7. **Multi-Currency**: Automatic location detection
8. **Easy Checkout**: Streamlined 1-page checkout

## 🔧 Troubleshooting

### Payment Not Working
- Check console for errors
- Verify API keys are correct
- Ensure scripts are loaded (check Network tab)
- Test with Razorpay/PayPal test credentials first

### Pricing Not Updating
- Check browser console for errors
- Verify `pricingManager` is initialized
- Clear localStorage and refresh

### Animations Not Working
- Ensure animations.css is loaded
- Check if Intersection Observer is supported
- Verify elements have `animate-on-scroll` class

## 📊 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 License

Copyright © 2026 Zelera. All rights reserved.

## 🤝 Support

For questions or support, contact:
- Email: support@zelera.com
- WhatsApp: +91-XXXXX-XXXXX

---

**Built with ❤️ for serious book businesses**
