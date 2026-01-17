"""
Payment app views with @never_cache decorators for security.
"""

import json
import logging
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods, require_GET, require_POST
from django.conf import settings
from django.utils import timezone
from .models import PaymentTransaction
from .webhooks import razorpay_webhook, paypal_webhook

logger = logging.getLogger('payment.webhooks')


@never_cache
@require_GET
def payment_success_view(request):
    """
    Success page view - MUST have valid session token.
    @never_cache prevents browser caching to stop back button exploitation.
    """
    # Get session token from URL
    token = request.GET.get('token', '')
    
    if not token:
        logger.warning("Success page accessed without token")
        return redirect('/')  # Redirect to home page
    
    try:
        # Find payment transaction by session token
        transaction = PaymentTransaction.objects.get(session_token=token)
        
        # Validate token
        if not transaction.is_token_valid():
            logger.warning(f"Invalid or expired token: {token[:10]}...")
            return render(request, 'payment/token_expired.html', {
                'message': 'This payment confirmation link has expired or already been used.'
            })
        
        # Mark token as used
        transaction.mark_token_used()
        
        logger.info(f"Success page accessed for order {transaction.order_id}")
        
        # Render success page with payment details and drive link
        context = {
            'transaction': transaction,
            'order_id': transaction.order_id,
            'payment_id': transaction.payment_id,
            'plan_name': transaction.get_plan_display(),
            'amount': transaction.amount,
            'currency': transaction.currency,
            'currency_symbol': get_currency_symbol(transaction.currency),
            'customer_name': transaction.customer_name,
            'customer_email': transaction.customer_email,
            'customer_phone': transaction.customer_phone,
            'drive_link': transaction.drive_link,
        }
        
        return render(request, 'success.html', context)
    
    except PaymentTransaction.DoesNotExist:
        logger.error(f"Payment transaction not found for token: {token[:10]}...")
        return render(request, 'payment/token_expired.html', {
            'message': 'Invalid payment confirmation link.'
        })


@never_cache
@require_GET
def checkout_view(request):
    """
    Checkout page view.
    """
    # Get order data from session
    plan = request.GET.get('plan', 'premium')
    
    context = {
        'plan': plan,
        'razorpay_key': settings.RAZORPAY_KEY_ID,
        'paypal_client_id': settings.PAYPAL_CLIENT_ID,
    }
    
    return render(request, 'checkout.html', context)


@never_cache
@require_POST
def get_session_token_api(request):
    """
    API endpoint to get session token after frontend payment success.
    Frontend calls this after receiving payment_id from gateway.
    """
    try:
        data = json.loads(request.body)
        payment_id = data.get('payment_id', '')
        
        if not payment_id:
            return JsonResponse({'error': 'Payment ID required'}, status=400)
        
        # Find payment transaction by payment ID
        try:
            transaction = PaymentTransaction.objects.get(
                payment_id=payment_id,
                webhook_received=True,
                status='success'
            )
            
            return JsonResponse({
                'success': True,
                'session_token': transaction.session_token,
                'success_url': f"/payment/success/?token={transaction.session_token}"
            })
        
        except PaymentTransaction.DoesNotExist:
            logger.warning(f"Payment not found or not verified: {payment_id}")
            return JsonResponse({
                'error': 'Payment not verified yet. Please wait a moment and try again.',
                'retry': True
            }, status=404)
    
    except Exception as e:
        logger.error(f"Error in get_session_token_api: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)


@never_cache
@require_POST
def initiate_payment_api(request):
    """
    API endpoint to store customer data before opening payment gateway.
    This is called from frontend before opening Razorpay/PayPal.
    """
    try:
        data = json.loads(request.body)
        
        # Store customer data in session for webhook processing
        request.session['pending_payment'] = {
            'customer_name': data.get('customer_name', ''),
            'customer_email': data.get('customer_email', ''),
            'customer_phone': data.get('customer_phone', ''),
            'customer_company': data.get('customer_company', ''),
            'plan': data.get('plan', 'premium'),
            'amount': data.get('amount', 0),
            'currency': data.get('currency', 'INR'),
        }
        
        return JsonResponse({'success': True})
    
    except Exception as e:
        logger.error(f"Error in initiate_payment_api: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)


def get_currency_symbol(currency):
    """Get currency symbol from currency code."""
    symbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
    }
    return symbols.get(currency, currency + ' ')
