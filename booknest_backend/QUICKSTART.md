# Quick Start Guide

## Step 1: Setup Environment

```bash
cd d:\Work\zel-1\booknest_backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Step 2: Configure `.env` File

```bash
copy .env.example .env
```

Edit `.env` and add:
- Razorpay webhook secret
- PayPal credentials
- Gmail app password
- Drive links for each plan

## Step 3: Initialize Database

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

## Step 4: Run Server

```bash
python manage.py runserver
```

## Step 5: Configure Webhooks

### Razorpay:
- URL: `https://yourdomain.com/payment/webhooks/razorpay/`
- Events: `payment.captured`, `payment.failed`

### PayPal:
- URL: `https://yourdomain.com/payment/webhooks/paypal/`
- Events: `PAYMENT.CAPTURE.COMPLETED`

## Step 6: Test
1. Complete a test payment
2. Check admin panel: `http://127.0.0.1:8000/admin/`
3. Verify email received
4. Check drive link is displayed

Done! 🎉
