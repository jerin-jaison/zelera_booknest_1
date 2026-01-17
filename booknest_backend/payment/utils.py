"""
Utility functions for payment app.
"""

import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger('payment.webhooks')


def send_payment_confirmation_email(transaction):
    """
    Send payment confirmation email with drive link to customer.
    """
    subject = f"Payment Successful - BookNest {transaction.get_plan_display()} Plan"
    
    # Prepare email context
    context = {
        'customer_name': transaction.customer_name,
        'order_id': transaction.order_id,
        'payment_id': transaction.payment_id,
        'plan_name': transaction.get_plan_display(),
        'amount': transaction.amount,
        'currency': transaction.currency,
        'drive_link': transaction.drive_link,
        'success_url': f"{settings.ALLOWED_HOSTS[0]}/payment/success/?token={transaction.session_token}",
    }
    
    # Plain text message
    message = f"""
Dear {transaction.customer_name},

Thank you for purchasing BookNest {transaction.get_plan_display()} Plan!

Order Details:
--------------
Order ID: {transaction.order_id}
Payment ID: {transaction.payment_id}
Plan: {transaction.get_plan_display()}
Amount Paid: {get_currency_symbol(transaction.currency)}{transaction.amount:,.2f}

Your BookNest Platform Download Link:
{transaction.drive_link}

You can also access your order details here:
{context['success_url']}

What's Next:
1. Download the platform using the link above
2. Follow the installation instructions included in the package
3. Access your admin credentials (sent in a separate email)

Need help? Contact us:
Email: teamzelera@gmail.com
Phone: +91 7012783442
WhatsApp: +91 7012783442

Thank you for choosing Zelera BookNest!

Best regards,
Team Zelera
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[transaction.customer_email],
            fail_silently=False,
        )
        logger.info(f"Email sent to {transaction.customer_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {transaction.customer_email}: {str(e)}")
        raise


def get_currency_symbol(currency):
    """
    Get currency symbol from currency code.
    """
    symbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
    }
    return symbols.get(currency, currency + ' ')
