"""
URL configuration for payment app.
"""
from django.urls import path
from . import views, webhooks

app_name = 'payment'

urlpatterns = [
    # Main pages
    path('checkout/', views.checkout_view, name='checkout'),
    path('success/', views.payment_success_view, name='success'),
    
    # API endpoints
    path('api/initiate/', views.initiate_payment_api, name='initiate_payment'),
    path('api/get-token/', views.get_session_token_api, name='get_session_token'),
    
    # Webhook endpoints (CRITICAL - no CSRF protection, signature verified instead)
    path('webhooks/razorpay/', webhooks.razorpay_webhook, name='razorpay_webhook'),
    path('webhooks/paypal/', webhooks.paypal_webhook, name='paypal_webhook'),
]
