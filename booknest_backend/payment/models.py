from django.db import models
from django.utils import timezone
import secrets


class PaymentTransaction(models.Model):
    """
    Model to track all payment transactions with webhook verification.
    """
    PLAN_CHOICES = [
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    
    # Order Information
    order_id = models.CharField(max_length=100, unique=True, db_index=True)
    payment_id = models.CharField(max_length=100, db_index=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    
    # Customer Information
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    customer_company = models.CharField(max_length=200, blank=True, null=True)
    
    # Payment Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=50)  # razorpay, paypal
    
    # Session Token (one-time use)
    session_token = models.CharField(max_length=64, unique=True, db_index=True)
    token_used = models.BooleanField(default=False)
    token_expires_at = models.DateTimeField()
    
    # Drive Link
    drive_link = models.URLField(max_length=500)
    
    # Webhook Verification
    webhook_received = models.BooleanField(default=False)
    webhook_signature_verified = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    accessed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional Data
    raw_webhook_data = models.JSONField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_id', 'status']),
            models.Index(fields=['payment_id']),
            models.Index(fields=['session_token']),
        ]
    
    def __str__(self):
        return f"{self.order_id} - {self.customer_name} - {self.get_plan_display()}"
    
    @staticmethod
    def generate_session_token():
        """Generate a secure random session token"""
        return secrets.token_urlsafe(48)
    
    def generate_order_id(self):
        """Generate a unique order ID"""
        import time
        timestamp = int(time.time() * 1000)
        return f"ZEL{timestamp}"
    
    def is_token_valid(self):
        """Check if the session token is still valid"""
        if self.token_used:
            return False
        if timezone.now() > self.token_expires_at:
            return False
        return True
    
    def mark_token_used(self):
        """Mark the session token as used"""
        self.token_used = True
        self.accessed_at = timezone.now()
        self.save(update_fields=['token_used', 'accessed_at', 'updated_at'])


class WebhookLog(models.Model):
    """
    Log all webhook requests for debugging and audit trail
    """
    payment_transaction = models.ForeignKey(
        PaymentTransaction, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='webhook_logs'
    )
    
    webhook_type = models.CharField(max_length=50)  # razorpay, paypal
    event_type = models.CharField(max_length=100)
    payment_id = models.CharField(max_length=100, db_index=True)
    
    signature_valid = models.BooleanField(default=False)
    processing_status = models.CharField(max_length=20)  # success, failed, duplicate
    
    raw_data = models.JSONField()
    error_message = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payment_id', 'created_at']),
            models.Index(fields=['webhook_type', 'event_type']),
        ]
    
    def __str__(self):
        return f"{self.webhook_type} - {self.event_type} - {self.payment_id}"
