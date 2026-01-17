# BookNest Backend - Django Payment Security

Complete Django backend for BookNest payment verification with webhook integration.

## Features

✅ **Webhook Verification** - Razorpay & PayPal webhooks with HMAC SHA256 signature validation  
✅ **Session Tokens** - One-time use tokens with 30-minute expiry  
✅ **@never_cache Decorators** - Prevents browser caching exploitation  
✅ **Security Middleware** - Blocks direct URL access without valid tokens  
✅ **Drive Link Delivery** - Automatic email delivery after payment verification  
✅ **Payment Tracking** - Complete audit trail with webhook logs  

## Installation & Setup

### 1. Install Dependencies

```bash
cd d:\Work\zel-1\booknest_backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
copy .env.example .env
```

**Required Configuration:**
- `RAZORPAY_WEBHOOK_SECRET` - Get from Razorpay Dashboard → Settings → Webhooks
- `PAYPAL_CLIENT_SECRET` - Get from PayPal Developer Dashboard  
- `PAYPAL_WEBHOOK_ID` - Get after creating webhook in PayPal
- `EMAIL_HOST_PASSWORD` - Gmail App Password (not regular password)
- `DRIVE_LINK_*` - Google Drive links for each plan

### 3. Run Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser (for Admin Access)

```bash
python manage.py createsuperuser
```

### 5. Run Development Server

```bash
python manage.py runserver
```

Server will run at: `http://127.0.0.1:8000`

## Webhook Configuration

### Razorpay Webhook Setup

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Settings → Webhooks → Create New Webhook
3. Webhook URL: `https://yourdomain.com/payment/webhooks/razorpay/`
4. Events: Select `payment.captured` and `payment.failed`
5. Copy the **Webhook Secret** and add to `.env`

### PayPal Webhook Setup

1. Go to [PayPal Developer](https://developer.paypal.com/)
2. My Apps & Credentials → Your App → Webhooks
3. Add Webhook URL: `https://yourdomain.com/payment/webhooks/paypal/`
4. Events: Select `PAYMENT.CAPTURE.COMPLETED` and `PAYMENT.CAPTURE.DENIED`
5. Copy the **Webhook ID** and add to `.env`

## Frontend Integration

Update your `payment.js` file to send payment data to Django backend:

```javascript
// After Razorpay payment success
handler: async (response) => {
    // First, wait for webhook to process (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get session token from Django
    const tokenResponse = await fetch('http://127.0.0.1:8000/payment/api/get-token/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            payment_id: response.razorpay_payment_id
        })
    });
    
    const data = await tokenResponse.json();
    
    if (data.success) {
        // Redirect to Django success page
        window.location.href = `http://127.0.0.1:8000${data.success_url}`;
    }
}
```

## Testing

### Test Razorpay Webhook Locally

Use ngrok to expose local server:

```bash
ngrok http 8000
```

Use the ngrok URL in Razorpay webhook configuration.

### Test Payment Flow

1. Start Django server: `python manage.py runserver`
2. Open checkout page
3. Complete test payment
4. Check Django admin for payment record
5. Verify email was sent
6. Access success page with token

## Admin Panel

Access admin panel at: `http://127.0.0.1:8000/admin/`

**Features:**
- View all payment transactions
- Check webhook logs
- Resend confirmation emails
- Monitor payment statuses

## Security Features

1. **Webhook Signature Verification** - All webhooks verified using HMAC SHA256
2. **Session Tokens** - One-time use, 30-minute expiry
3. **@never_cache** - Prevents caching of sensitive pages
4. **Middleware Protection** - Blocks unauthorized access
5. **CSRF Protection** - Enabled for all forms
6. **Database Logging** - Complete audit trail

## Troubleshooting

### Webhook Not Received

- Check ngrok is running (for local testing)
- Verify webhook URL is correct in Razorpay/PayPal dashboard
- Check `payment_webhooks.log` for errors

### Email Not Sent

- Verify Gmail App Password (not regular password)
- Check Django logs for email errors
- Ensure `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` are set

### Token Expired Error

- Tokens expire after 30 minutes
- Tokens are single-use only
- User must complete payment flow within 30 minutes

## Production Deployment

1. Set `DEBUG=False` in `.env`
2. Configure proper `ALLOWED_HOSTS`
3. Use production database (PostgreSQL/MySQL)
4. Set up SSL certificate (required for webhooks)
5. Configure static files serving
6. Use production WSGI server (Gunicorn/uWSGI)

## Support

For issues or questions:
- Email: teamzelera@gmail.com
- Phone: +91 7012783442
