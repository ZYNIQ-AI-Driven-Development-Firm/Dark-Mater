"""
Email service for sending OTP and notifications.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from loguru import logger

from app.core.config import get_settings
from app.templates.email_templates import get_otp_email_template, get_welcome_email_template

settings = get_settings()


class EmailService:
    """Email service using SMTP."""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_pass = settings.SMTP_PASS
        self.from_email = settings.SMTP_USER_SEND_FROM or settings.SMTP_USER
        self.from_name = settings.EMAIL_FROM_NAME
    
    async def send_otp_email(self, to_email: str, otp: str) -> bool:
        """Send OTP via email using SMTP."""
        if not self.smtp_host or not self.smtp_user or not self.smtp_pass:
            # For development, log OTP instead of sending email
            logger.info(f"OTP for {to_email}: {otp}")
            return True
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "Your Login Code - Dark Matter MCP"
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Create HTML content using the styled template
            html_content = get_otp_email_template(otp, to_email)
            
            # Create plain text content
            plain_content = f"""
            ┌─────────────────────────────────────────────────┐
            │              DARK MATTER MCP                    │
            │         Authentication Code Required            │
            └─────────────────────────────────────────────────┘
            
            > auth --verify --email={to_email}
            
            [ ACCESS_TOKEN ]: {otp}
            
            ┌─────────────────────────────────────────────────┐
            │  SECURITY NOTICE:                               │
            │  • Code expires in 10 minutes                   │
            │  • Single-use authentication token              │
            │  • Never share this code with anyone            │
            └─────────────────────────────────────────────────┘
            
            If you didn't request this code, please ignore this email.
            
            © 2025 Dark Matter MCP - Secure MCP Client
            """
            
            # Create MIMEText objects
            part1 = MIMEText(plain_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            
            # Attach parts
            msg.attach(part1)
            msg.attach(part2)
            
            # Connect to SMTP server and send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()  # Enable TLS encryption
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
            
            logger.info(f"OTP email sent successfully to {to_email}")
            return True
                
        except Exception as e:
            logger.error(f"Error sending OTP email to {to_email}: {str(e)}")
            return False
    
    async def send_welcome_email(self, to_email: str, username: str) -> bool:
        """Send welcome email to new users using SMTP."""
        if not self.smtp_host or not self.smtp_user or not self.smtp_pass:
            logger.info(f"Welcome email would be sent to {to_email} for user {username}")
            return True
            
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "Welcome to Dark Matter MCP!"
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            # Create HTML content using the styled template
            html_content = get_welcome_email_template(username, to_email)
            
            # Create plain text content
            plain_content = f"""
            ┌─────────────────────────────────────────────────┐
            │              DARK MATTER MCP                    │
            │          Connection Established                 │
            └─────────────────────────────────────────────────┘
            
            Welcome, {username}!
            
            Your Dark Matter MCP Client account has been successfully 
            initialized. You now have access to the most advanced 
            Model Context Protocol interface available.
            
            [ AVAILABLE_MODULES ]:
            > Connect to multiple MCP servers
            > Persistent conversation memory  
            > Advanced security workflows
            > Real-time task orchestration
            > WebSocket communication
            
            Get started at: [Your Dashboard URL]
            
            © 2025 Dark Matter MCP - Advanced MCP Client
            """
            
            # Create MIMEText objects
            part1 = MIMEText(plain_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            
            # Attach parts
            msg.attach(part1)
            msg.attach(part2)
            
            # Connect to SMTP server and send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()  # Enable TLS encryption
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
            
            logger.info(f"Welcome email sent successfully to {to_email}")
            return True
                
        except Exception as e:
            logger.error(f"Error sending welcome email to {to_email}: {str(e)}")
            return False