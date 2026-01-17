from django.contrib import admin
from .models import PaymentTransaction, WebhookLog


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'order_id', 'customer_name', 'plan', 'amount', 'currency',
        'status', 'payment_method', 'webhook_received', 'created_at'
    ]
    list_filter = ['status', 'plan', 'payment_method', 'webhook_received', 'created_at']
    search_fields = ['order_id', 'payment_id', 'customer_name', 'customer_email']
    readonly_fields = [
        'order_id', 'payment_id', 'session_token', 'created_at',
        'updated_at', 'accessed_at', 'raw_webhook_data'
    ]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_id', 'payment_id', 'plan', 'amount', 'currency', 'payment_method')
        }),
        ('Customer Information', {
            'fields': ('customer_name', 'customer_email', 'customer_phone', 'customer_company')
        }),
        ('Payment Status', {
            'fields': ('status', 'webhook_received', 'webhook_signature_verified')
        }),
        ('Session Token', {
            'fields': ('session_token', 'token_used', 'token_expires_at', 'accessed_at')
        }),
        ('Drive Link', {
            'fields': ('drive_link',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
        ('Raw Data', {
            'fields': ('raw_webhook_data',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Payments should only be created via webhooks
        return False


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display = [
        'webhook_type', 'event_type', 'payment_id',
        'signature_valid', 'processing_status', 'created_at'
    ]
    list_filter = ['webhook_type', 'signature_valid', 'processing_status', 'created_at']
    search_fields = ['payment_id', 'event_type']
    readonly_fields = ['created_at', 'raw_data']
    
    fieldsets = (
        ('Webhook Information', {
            'fields': ('webhook_type', 'event_type', 'payment_id', 'payment_transaction')
        }),
        ('Verification', {
            'fields': ('signature_valid', 'processing_status', 'error_message')
        }),
        ('Data', {
            'fields': ('raw_data',),
            'classes': ('collapse',)
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
    
    def has_add_permission(self, request):
        # Webhook logs should only be created automatically
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of audit logs
        return False
