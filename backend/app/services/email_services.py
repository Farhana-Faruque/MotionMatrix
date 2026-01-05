"""
Email sending service with SMTP support.

This module provides email functionality for the application including
user notifications, password resets, and administrative communications.

Features:
- Synchronous and asynchronous email sending
- HTML email templates
- SMTP error handling and retries
- Email validation and sanitization
- Configurable SMTP settings

Example:
    from app.services.email_service import EmailService
    
    email_service = EmailService()
    
    # Send welcome email
    await email_service.send_welcome_email(
        to="user@example.com",
        full_name="John Doe",
        temp_password="TempPass123!",
        role=UserRole.WORKER
    )
"""

import logging
import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from datetime import datetime

import aiosmtplib

from backend.app.core.config import get_settings
from backend.app.utils.enums import UserRole


# Configure logging
logger = logging.getLogger(__name__)

# Load settings
settings = get_settings()


# ============================================================================
# Email Service Class
# ============================================================================

class EmailService:
    """
    Service for sending emails via SMTP.
    
    Provides both synchronous and asynchronous email sending with proper
    error handling, retry logic, and HTML template support.
    
    Attributes:
        smtp_host: SMTP server hostname
        smtp_port: SMTP server port
        smtp_user: SMTP username
        smtp_password: SMTP password
        from_email: Sender email address
        from_name: Sender display name
        use_tls: Whether to use TLS encryption
        
    Example:
        email_service = EmailService()
        
        # Sync send
        email_service.send_welcome_email(
            to="user@example.com",
            full_name="John Doe",
            temp_password="TempPass123!",
            role=UserRole.WORKER
        )
        
        # Async send
        await email_service.send_welcome_email_async(...)
        
    Notes:
        - Emails are sent only if EMAILS_ENABLED is True
        - Failed sends are logged but don't raise exceptions
        - HTML emails with fallback plain text
        - Configurable via environment variables
    """
    
    def __init__(self):
        """Initialize EmailService with configuration from settings."""
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        self.from_name = settings.FROM_NAME
        self.use_tls = settings.SMTP_TLS
        self.enabled = settings.EMAILS_ENABLED
        
        logger.info(
            f"EmailService initialized: "
            f"{'enabled' if self.enabled else 'disabled'}, "
            f"host={self.smtp_host}:{self.smtp_port}"
        )
    
    # ========================================================================
    # HTML Template Methods
    # ========================================================================
    
    def _get_base_template(self, content: str) -> str:
        """
        Get base HTML email template with content.
        
        Args:
            content: HTML content to insert
            
        Returns:
            str: Complete HTML email
        """
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Motion Matrix</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background-color: #4A90E2;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }}
        .content {{
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
        }}
        .button {{
            display: inline-block;
            padding: 12px 24px;
            background-color: #4A90E2;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
        }}
        .credentials {{
            background-color: #fff;
            padding: 15px;
            border-left: 4px solid #4A90E2;
            margin: 20px 0;
        }}
        .footer {{
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }}
        .warning {{
            color: #d32f2f;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Motion Matrix</h1>
        <p>Employee Management System</p>
    </div>
    <div class="content">
        {content}
    </div>
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; {datetime.now().year} Motion Matrix. All rights reserved.</p>
    </div>
</body>
</html>
"""
    
    def _get_welcome_email_html(
        self,
        full_name: str,
        temp_password: str,
        role: UserRole
    ) -> str:
        """Generate welcome email HTML content."""
        content = f"""
        <h2>Welcome to Motion Matrix!</h2>
        <p>Hello <strong>{full_name}</strong>,</p>
        <p>Your account has been created with the role: <strong>{role.value}</strong></p>
        
        <div class="credentials">
            <h3>Your Login Credentials</h3>
            <p><strong>Temporary Password:</strong> <code>{temp_password}</code></p>
        </div>
        
        <p class="warning">⚠️ Important: You must change your password on first login for security reasons.</p>
        
        <p>Please keep your credentials secure and do not share them with anyone.</p>
        
        <p>Best regards,<br>
        Motion Matrix Team</p>
"""
        return self._get_base_template(content)
    
    def _get_password_reset_email_html(
        self,
        full_name: str,
        new_password: str
    ) -> str:
        """Generate password reset email HTML content."""
        content = f"""
        <h2>Password Reset</h2>
        <p>Hello <strong>{full_name}</strong>,</p>
        <p>Your password has been reset by an administrator.</p>
        
        <div class="credentials">
            <h3>Your New Password</h3>
            <p><strong>New Password:</strong> <code>{new_password}</code></p>
        </div>
        
        <p class="warning">⚠️ Important: Please change this password immediately after logging in.</p>
        
        <p>If you did not request this password reset, please contact your administrator immediately.</p>
        
        <p>Best regards,<br>
        Motion Matrix Team</p>
"""
        return self._get_base_template(content)
    
    # ========================================================================
    # Core Email Sending Methods
    # ========================================================================
    
    def _create_message(
        self,
        to: str,
        subject: str,
        html_body: str,
        plain_body: Optional[str] = None
    ) -> MIMEMultipart:
        """
        Create MIME message with HTML and plain text parts.
        
        Args:
            to: Recipient email address
            subject: Email subject
            html_body: HTML email content
            plain_body: Plain text fallback (optional)
            
        Returns:
            MIMEMultipart: Configured email message
        """
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{self.from_name} <{self.from_email}>"
        message["To"] = to
        
        # Plain text fallback
        if plain_body:
            part1 = MIMEText(plain_body, "plain")
            message.attach(part1)
        
        # HTML content
        part2 = MIMEText(html_body, "html")
        message.attach(part2)
        
        return message
    
    def send_email_sync(
        self,
        to: str,
        subject: str,
        html_body: str,
        plain_body: Optional[str] = None,
        retries: int = 3
    ) -> bool:
        """
        Send email synchronously via SMTP.
        
        Args:
            to: Recipient email address
            subject: Email subject
            html_body: HTML email content
            plain_body: Plain text fallback
            retries: Number of retry attempts on failure
            
        Returns:
            bool: True if sent successfully, False otherwise
            
        Example:
            success = email_service.send_email_sync(
                to="user@example.com",
                subject="Welcome!",
                html_body="<h1>Welcome</h1>"
            )
            
        Notes:
            - Returns False if emails are disabled
            - Logs errors but doesn't raise exceptions
            - Retries on transient failures
        """
        if not self.enabled:
            logger.info("Email sending is disabled, skipping email to %s", to)
            return False
        
        if not self.smtp_user or not self.smtp_password:
            logger.error("SMTP credentials not configured")
            return False
        
        logger.info(f"Sending email to {to}: {subject}")
        
        message = self._create_message(to, subject, html_body, plain_body)
        
        for attempt in range(retries):
            try:
                # Connect to SMTP server
                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    # Enable TLS if configured
                    if self.use_tls:
                        server.starttls()
                    
                    # Login
                    server.login(self.smtp_user, self.smtp_password)
                    
                    # Send email
                    server.send_message(message)
                    
                    logger.info(f"Email sent successfully to {to}")
                    return True
                    
            except smtplib.SMTPException as e:
                logger.error(
                    f"SMTP error sending email to {to} (attempt {attempt + 1}/{retries}): {e}"
                )
                if attempt == retries - 1:
                    logger.error(f"Failed to send email to {to} after {retries} attempts")
                    return False
                    
            except Exception as e:
                logger.error(f"Unexpected error sending email to {to}: {e}")
                return False
        
        return False
    
    async def send_email_async(
        self,
        to: str,
        subject: str,
        html_body: str,
        plain_body: Optional[str] = None,
        retries: int = 3
    ) -> bool:
        """
        Send email asynchronously via SMTP.
        
        Args:
            to: Recipient email address
            subject: Email subject
            html_body: HTML email content
            plain_body: Plain text fallback
            retries: Number of retry attempts
            
        Returns:
            bool: True if sent successfully
            
        Example:
            success = await email_service.send_email_async(
                to="user@example.com",
                subject="Welcome!",
                html_body="<h1>Welcome</h1>"
            )
            
        Notes:
            - Non-blocking, doesn't block event loop
            - Same error handling as sync version
        """
        if not self.enabled:
            logger.info("Email sending is disabled, skipping email to %s", to)
            return False
        
        if not self.smtp_user or not self.smtp_password:
            logger.error("SMTP credentials not configured")
            return False
        
        logger.info(f"Sending email async to {to}: {subject}")
        
        message = self._create_message(to, subject, html_body, plain_body)
        
        for attempt in range(retries):
            try:
                # Use aiosmtplib for async sending
                await aiosmtplib.send(
                    message,
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    username=self.smtp_user,
                    password=self.smtp_password,
                    use_tls=self.use_tls,
                )
                
                logger.info(f"Email sent successfully (async) to {to}")
                return True
                
            except Exception as e:
                logger.error(
                    f"Error sending email async to {to} "
                    f"(attempt {attempt + 1}/{retries}): {e}"
                )
                if attempt == retries - 1:
                    logger.error(
                        f"Failed to send email async to {to} after {retries} attempts"
                    )
                    return False
        
        return False
    
    # ========================================================================
    # High-Level Email Methods
    # ========================================================================
    
    def send_welcome_email(
        self,
        to: str,
        full_name: str,
        temp_password: str,
        role: UserRole
    ) -> bool:
        """
        Send welcome email with temporary credentials (synchronous).
        
        Args:
            to: Recipient email address
            full_name: User's full name
            temp_password: Temporary password
            role: User's role
            
        Returns:
            bool: True if sent successfully
            
        Example:
            success = email_service.send_welcome_email(
                to="newuser@example.com",
                full_name="John Doe",
                temp_password="TempPass123!",
                role=UserRole.WORKER
            )
        """
        subject = "Welcome to Motion Matrix - Your Account Credentials"
        html_body = self._get_welcome_email_html(full_name, temp_password, role)
        
        plain_body = f"""
Welcome to Motion Matrix!

Hello {full_name},

Your account has been created with the role: {role.value}

Your Login Credentials:
Temporary Password: {temp_password}

⚠️ Important: You must change your password on first login for security reasons.

Please keep your credentials secure and do not share them with anyone.

Best regards,
Motion Matrix Team
"""
        
        return self.send_email_sync(to, subject, html_body, plain_body)
    
    async def send_welcome_email_async(
        self,
        to: str,
        full_name: str,
        temp_password: str,
        role: UserRole
    ) -> bool:
        """
        Send welcome email with temporary credentials (asynchronous).
        
        Same as send_welcome_email but non-blocking.
        """
        subject = "Welcome to Motion Matrix - Your Account Credentials"
        html_body = self._get_welcome_email_html(full_name, temp_password, role)
        
        plain_body = f"""
Welcome to Motion Matrix!

Hello {full_name},

Your account has been created with the role: {role.value}

Your Login Credentials:
Temporary Password: {temp_password}

⚠️ Important: You must change your password on first login for security reasons.

Best regards,
Motion Matrix Team
"""
        
        return await self.send_email_async(to, subject, html_body, plain_body)
    
    def send_password_reset_email(
        self,
        to: str,
        full_name: str,
        new_password: str
    ) -> bool:
        """
        Send password reset email (synchronous).
        
        Args:
            to: Recipient email address
            full_name: User's full name
            new_password: New password
            
        Returns:
            bool: True if sent successfully
            
        Example:
            success = email_service.send_password_reset_email(
                to="user@example.com",
                full_name="John Doe",
                new_password="NewPass123!"
            )
        """
        subject = "Motion Matrix - Password Reset"
        html_body = self._get_password_reset_email_html(full_name, new_password)
        
        plain_body = f"""
Password Reset

Hello {full_name},

Your password has been reset by an administrator.

Your New Password: {new_password}

⚠️ Important: Please change this password immediately after logging in.

If you did not request this password reset, please contact your administrator immediately.

Best regards,
Motion Matrix Team
"""
        
        return self.send_email_sync(to, subject, html_body, plain_body)
    
    async def send_password_reset_email_async(
        self,
        to: str,
        full_name: str,
        new_password: str
    ) -> bool:
        """Send password reset email (asynchronous)."""
        subject = "Motion Matrix - Password Reset"
        html_body = self._get_password_reset_email_html(full_name, new_password)
        
        plain_body = f"""
Password Reset

Hello {full_name},

Your password has been reset by an administrator.

Your New Password: {new_password}

⚠️ Important: Please change this password immediately after logging in.

Best regards,
Motion Matrix Team
"""
        
        return await self.send_email_async(to, subject, html_body, plain_body)
    
    def send_generic_email(
        self,
        to: str,
        subject: str,
        body: str,
        is_html: bool = False
    ) -> bool:
        """
        Send generic email (synchronous).
        
        Args:
            to: Recipient email address
            subject: Email subject
            body: Email body (plain text or HTML)
            is_html: If True, body is treated as HTML
            
        Returns:
            bool: True if sent successfully
            
        Example:
            email_service.send_generic_email(
                to="user@example.com",
                subject="Important Notice",
                body="<h1>Notice</h1><p>Important update...</p>",
                is_html=True
            )
        """
        if is_html:
            html_body = self._get_base_template(body)
            return self.send_email_sync(to, subject, html_body, body)
        else:
            # Plain text email
            return self.send_email_sync(to, subject, body, body)
    
    async def send_generic_email_async(
        self,
        to: str,
        subject: str,
        body: str,
        is_html: bool = False
    ) -> bool:
        """Send generic email (asynchronous)."""
        if is_html:
            html_body = self._get_base_template(body)
            return await self.send_email_async(to, subject, html_body, body)
        else:
            return await self.send_email_async(to, subject, body, body)
    
    # ========================================================================
    # Bulk Email Methods
    # ========================================================================
    
    async def send_bulk_emails_async(
        self,
        recipients: List[tuple[str, str, str]],  # [(to, subject, body), ...]
        is_html: bool = False
    ) -> dict:
        """
        Send multiple emails asynchronously (non-blocking).
        
        Args:
            recipients: List of (to, subject, body) tuples
            is_html: If True, bodies are treated as HTML
            
        Returns:
            dict: Results with success/failure counts
            
        Example:
            results = await email_service.send_bulk_emails_async([
                ("user1@example.com", "Subject 1", "Body 1"),
                ("user2@example.com", "Subject 2", "Body 2"),
            ])
        """
        tasks = []
        for to, subject, body in recipients:
            task = self.send_generic_email_async(to, subject, body, is_html)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        success = sum(1 for r in results if r is True)
        failed = len(results) - success
        
        logger.info(f"Bulk email results: {success} sent, {failed} failed")
        
        return {
            "total": len(recipients),
            "success": success,
            "failed": failed
        }
    
    # ========================================================================
    # Utility Methods
    # ========================================================================
    
    def test_connection(self) -> bool:
        """
        Test SMTP connection.
        
        Returns:
            bool: True if connection successful
            
        Example:
            if email_service.test_connection():
                print("SMTP configured correctly")
        """
        if not self.enabled:
            logger.info("Email sending is disabled")
            return False
        
        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                logger.info("SMTP connection test successful")
                return True
                
        except Exception as e:
            logger.error(f"SMTP connection test failed: {e}")
            return False


# ============================================================================
# Singleton Instance
# ============================================================================

# Create singleton instance
_email_service = None

def get_email_service() -> EmailService:
    """
    Get singleton EmailService instance.
    
    Returns:
        EmailService: Singleton instance
        
    Example:
        from app.services.email_service import get_email_service
        
        email_service = get_email_service()
        email_service.send_welcome_email(...)
    """
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service


# ============================================================================
# Module Initialization
# ============================================================================

logger.info("Email service module initialized")