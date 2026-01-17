"""
Webhook handlers for Razorpay and PayPal payment verification.
CRITICAL: These handle server-side payment verification.
"""

import hmac
import hashlib
import json
import logging
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils import timezone
from datetime import timedelta
from .models import PaymentTransaction, WebhookLog
from .utils import send_payment_confirmation_email

logger = logging.getLogger('payment.webhooks')


@csrf_exempt
@require_POST
def razorpay_webhook(request):
    """
    Handle Razorpay webhook for payment verification.
    This is CRITICAL for security - verifies webhook signature using HMAC SHA256.
    """
    try:
        # Get webhook signature from headers
        webhook_signature = request.headers.get('X-Razorpay-Signature', '')
        webhook_body = request.body
        
        # Verify webhook signature
        if not verify_razorpay_signature(webhook_body, webhook_signature):
            logger.error("Razorpay webhook signature verification failed")
            WebhookLog.objects.create(
                webhook_type='razorpay',
                event_type='signature_failed',
                payment_id='unknown',
                signature_valid=False,
                processing_status='failed',
                raw_data={'error': 'Invalid signature'},
                error_message='Webhook signature verification failed'
            )
            return HttpResponse(status=400)
        
        # Parse webhook data
        try:
            data = json.loads(webhook_body)
        except json.JSONDecodeError:
            logger.error("Invalid JSON in Razorpay webhook")
            return HttpResponse(status=400)
        
        event = data.get('event')
        payload = data.get('payload', {})
        payment_entity = payload.get('payment', {}).get('entity', {})
        
        payment_id = payment_entity.get('id', '')
        amount = payment_entity.get('amount', 0) / 100  # Razorpay sends amount in paise
        currency = payment_entity.get('currency', 'INR')
        status = payment_entity.get('status', '')
        
        logger.info(f"Razorpay webhook received: {event} for payment {payment_id}")
        
        # Check for duplicate webhook
        existing_logs = WebhookLog.objects.filter(
            payment_id=payment_id,
            webhook_type='razorpay',
            signature_valid=True
        ).count()
        
        if existing_logs > 0:
            logger.info(f"Duplicate webhook for payment {payment_id}, skipping")
            WebhookLog.objects.create(
                webhook_type='razorpay',
                event_type=event,
                payment_id=payment_id,
                signature_valid=True,
                processing_status='duplicate',
                raw_data=data
            )
            return HttpResponse(status=200)  # Return 200 to acknowledge receipt
        
        # Process payment based on event
        if event == 'payment.captured':
            process_razorpay_payment_success(payment_entity, data)
        elif event == 'payment.failed':
            process_razorpay_payment_failure(payment_entity, data)
        
        # Log webhook
        WebhookLog.objects.create(
            webhook_type='razorpay',
            event_type=event,
            payment_id=payment_id,
            signature_valid=True,
            processing_status='success',
            raw_data=data
        )
        
        return HttpResponse(status=200)
    
    except Exception as e:
        logger.error(f"Error processing Razorpay webhook: {str(e)}")
        return HttpResponse(status=500)


def verify_razorpay_signature(webhook_body, signature):
    """
    Verify Razorpay webhook signature using HMAC SHA256.
    """
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
    
    if not webhook_secret:
        logger.error("Razorpay webhook secret not configured")
        return False
    
    # Generate expected signature
    expected_signature = hmac.new(
        webhook_secret.encode('utf-8'),
        webhook_body,
        hashlib.sha256
    ).hexdigest()
    
    # Compare signatures
    return hmac.compare_digest(expected_signature, signature)


def process_razorpay_payment_success(payment_entity, raw_data):
    """
    Process successful Razorpay payment.
    Creates PaymentTransaction and generates session token.
    """
    payment_id = payment_entity.get('id')
    amount = payment_entity.get('amount', 0) / 100
    currency = payment_entity.get('currency', 'INR')
    
    # Extract customer details from notes
    notes = payment_entity.get('notes', {})
    customer_name = notes.get('customer_name', payment_entity.get('email', ''))
    customer_email = notes.get('customer_email', payment_entity.get('email', ''))
    customer_phone = notes.get('customer_phone', payment_entity.get('contact', ''))
    customer_company = notes.get('customer_company', '')
    plan = notes.get('plan', 'premium').lower()
    
    # Generate order ID and session token
    order_id = f"ZEL{int(timezone.now().timestamp() * 1000)}"
    session_token = PaymentTransaction.generate_session_token()
    token_expires_at = timezone.now() + timedelta(minutes=30)
    
    # Get drive link for plan
    drive_link = settings.DRIVE_LINKS.get(plan, settings.DRIVE_LINKS.get('premium', ''))
    
    # Create payment transaction
    transaction = PaymentTransaction.objects.create(
        order_id=order_id,
        payment_id=payment_id,
        plan=plan,
        amount=amount,
        currency=currency,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        customer_company=customer_company,
        status='success',
        payment_method='razorpay',
        session_token=session_token,
        token_expires_at=token_expires_at,
        drive_link=drive_link,
        webhook_received=True,
        webhook_signature_verified=True,
        raw_webhook_data=raw_data
    )
    
    logger.info(f"Payment transaction created: {order_id}")
    
    # Send confirmation email with drive link
    try:
        send_payment_confirmation_email(transaction)
        logger.info(f"Confirmation email sent to {customer_email}")
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {str(e)}")
    
    return transaction


def process_razorpay_payment_failure(payment_entity, raw_data):
    """
    Process failed Razorpay payment.
    """
    payment_id = payment_entity.get('id')
    logger.info(f"Payment failed: {payment_id}")
    
    # Log failure for analytics
    notes = payment_entity.get('notes', {})
    customer_email = notes.get('customer_email', payment_entity.get('email', ''))
    
    WebhookLog.objects.create(
        webhook_type='razorpay',
        event_type='payment.failed',
        payment_id=payment_id,
        signature_valid=True,
        processing_status='payment_failed',
        raw_data=raw_data,
        error_message=f"Payment failed for {customer_email}"
    )


@csrf_exempt
@require_POST
def paypal_webhook(request):
    """
    Handle PayPal webhook for payment verification.
    Verifies PayPal webhook signature.
    """
    try:
        # Get webhook data
        webhook_body = request.body
        
        try:
            data = json.loads(webhook_body)
        except json.JSONDecodeError:
            logger.error("Invalid JSON in PayPal webhook")
            return HttpResponse(status=400)
        
        event_type = data.get('event_type', '')
        resource = data.get('resource', {})
        
        # Verify PayPal webhook signature
        if not verify_paypal_signature(request, webhook_body):
            logger.error("PayPal webhook signature verification failed")
            WebhookLog.objects.create(
                webhook_type='paypal',
                event_type=event_type,
                payment_id=resource.get('id', 'unknown'),
                signature_valid=False,
                processing_status='failed',
                raw_data=data,
                error_message='Webhook signature verification failed'
            )
            return HttpResponse(status=400)
        
        payment_id = resource.get('id', '')
        
        logger.info(f"PayPal webhook received: {event_type} for payment {payment_id}")
        
        # Check for duplicate webhook
        existing_logs = WebhookLog.objects.filter(
            payment_id=payment_id,
            webhook_type='paypal',
            signature_valid=True
        ).count()
        
        if existing_logs > 0:
            logger.info(f"Duplicate PayPal webhook for payment {payment_id}, skipping")
            WebhookLog.objects.create(
                webhook_type='paypal',
                event_type=event_type,
                payment_id=payment_id,
                signature_valid=True,
                processing_status='duplicate',
                raw_data=data
            )
            return HttpResponse(status=200)
        
        # Process payment based on event
        if event_type == 'PAYMENT.CAPTURE.COMPLETED':
            process_paypal_payment_success(resource, data)
        elif event_type in ['PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.REFUNDED']:
            process_paypal_payment_failure(resource, data)
        
        # Log webhook
        WebhookLog.objects.create(
            webhook_type='paypal',
            event_type=event_type,
            payment_id=payment_id,
            signature_valid=True,
            processing_status='success',
            raw_data=data
        )
        
        return HttpResponse(status=200)
    
    except Exception as e:
        logger.error(f"Error processing PayPal webhook: {str(e)}")
        return HttpResponse(status=500)


def verify_paypal_signature(request, webhook_body):
    """
    Verify PayPal webhook signature.
    Uses PayPal SDK for verification.
    """
    import paypalrestsdk
    from paypalrestsdk.notifications import WebhookEvent
    
    # Configure PayPal SDK
    paypalrestsdk.configure({
        "mode": settings.PAYPAL_MODE,
        "client_id": settings.PAYPAL_CLIENT_ID,
        "client_secret": settings.PAYPAL_CLIENT_SECRET
    })
    
    # Get headers
    transmission_id = request.headers.get('Paypal-Transmission-Id')
    transmission_time = request.headers.get('Paypal-Transmission-Time')
    cert_url = request.headers.get('Paypal-Cert-Url')
    auth_algo = request.headers.get('Paypal-Auth-Algo')
    transmission_sig = request.headers.get('Paypal-Transmission-Sig')
    webhook_id = settings.PAYPAL_WEBHOOK_ID
    
    if not all([transmission_id, transmission_time, cert_url, transmission_sig, webhook_id]):
        logger.error("Missing PayPal webhook headers")
        return False
    
    try:
        # Verify using PayPal SDK
        result = WebhookEvent.verify(
            transmission_id,
            transmission_time,
            webhook_id,
            webhook_body.decode('utf-8'),
            cert_url,
            transmission_sig,
            auth_algo
        )
        return result
    except Exception as e:
        logger.error(f"PayPal signature verification error: {str(e)}")
        return False


def process_paypal_payment_success(resource, raw_data):
    """
    Process successful PayPal payment.
    Creates PaymentTransaction and generates session token.
    """
    payment_id = resource.get('id')
    amount_data = resource.get('amount', {})
    amount = float(amount_data.get('value', 0))
    currency = amount_data.get('currency_code', 'USD')
    
    # Extract customer details from custom_id or metadata
    custom_data = json.loads(resource.get('custom_id', '{}')) if resource.get('custom_id') else {}
    customer_name = custom_data.get('customer_name', '')
    customer_email = custom_data.get('customer_email', '')
    customer_phone = custom_data.get('customer_phone', '')
    customer_company = custom_data.get('customer_company', '')
    plan = custom_data.get('plan', 'premium').lower()
    
    # Generate order ID and session token
    order_id = f"ZEL{int(timezone.now().timestamp() * 1000)}"
    session_token = PaymentTransaction.generate_session_token()
    token_expires_at = timezone.now() + timedelta(minutes=30)
    
    # Get drive link for plan
    drive_link = settings.DRIVE_LINKS.get(plan, settings.DRIVE_LINKS.get('premium', ''))
    
    # Create payment transaction
    transaction = PaymentTransaction.objects.create(
        order_id=order_id,
        payment_id=payment_id,
        plan=plan,
        amount=amount,
        currency=currency,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        customer_company=customer_company,
        status='success',
        payment_method='paypal',
        session_token=session_token,
        token_expires_at=token_expires_at,
        drive_link=drive_link,
        webhook_received=True,
        webhook_signature_verified=True,
        raw_webhook_data=raw_data
    )
    
    logger.info(f"PayPal payment transaction created: {order_id}")
    
    # Send confirmation email with drive link
    try:
        send_payment_confirmation_email(transaction)
        logger.info(f"Confirmation email sent to {customer_email}")
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {str(e)}")
    
    return transaction


def process_paypal_payment_failure(resource, raw_data):
    """
    Process failed PayPal payment.
    """
    payment_id = resource.get('id')
    logger.info(f"PayPal payment failed: {payment_id}")
    
    WebhookLog.objects.create(
        webhook_type='paypal',
        event_type='payment.failed',
        payment_id=payment_id,
        signature_valid=True,
        processing_status='payment_failed',
        raw_data=raw_data,
        error_message=f"PayPal payment failed: {payment_id}"
    )
