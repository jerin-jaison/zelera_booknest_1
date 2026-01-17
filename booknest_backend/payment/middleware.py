"""
Custom middleware for payment verification.
"""

import logging
from django.shortcuts import redirect
from django.urls import resolve

logger = logging.getLogger('payment.webhooks')


class PaymentVerificationMiddleware:
    """
    Middleware to ensure success page is only accessible with valid session token.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Get the requested URL path
        path = request.path
        
        # Check if accessing success page
        if path == '/payment/success/':
            # Success page MUST have a token parameter
            token = request.GET.get('token', '')
            
            if not token:
                logger.warning(f"Attempted access to success page without token from IP: {self.get_client_ip(request)}")
                # Redirect to home page if no token
                return redirect('/')
        
        response = self.get_response(request)
        return response
    
    @staticmethod
    def get_client_ip(request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
