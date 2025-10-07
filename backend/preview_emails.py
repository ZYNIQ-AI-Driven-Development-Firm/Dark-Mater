"""
Email template preview generator - Create HTML files to preview the email templates
"""
from app.templates.email_templates import get_otp_email_template, get_welcome_email_template

def generate_preview_files():
    """Generate HTML preview files for email templates."""
    
    # Generate OTP email preview
    otp_html = get_otp_email_template("123456", "user@example.com")
    with open("otp_email_preview.html", "w", encoding="utf-8") as f:
        f.write(otp_html)
    
    # Generate welcome email preview
    welcome_html = get_welcome_email_template("John Doe", "john@example.com")
    with open("welcome_email_preview.html", "w", encoding="utf-8") as f:
        f.write(welcome_html)
    
    print("✅ Email template previews generated!")
    print("📄 otp_email_preview.html - OTP email template")
    print("📄 welcome_email_preview.html - Welcome email template")

if __name__ == "__main__":
    generate_preview_files()