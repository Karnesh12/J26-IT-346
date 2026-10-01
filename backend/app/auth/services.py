import secrets
import smtplib
import string
from datetime import timedelta
from email.message import EmailMessage

import bcrypt
from flask import current_app

from ..extensions import db
from ..models import OTPCode, utc_now


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password, password_hash):
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def hash_code(code):
    return bcrypt.hashpw(code.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_code(code, code_hash):
    try:
        return bcrypt.checkpw(code.encode("utf-8"), code_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def mail_is_configured():
    return bool(current_app.config["MAIL_SERVER"] and current_app.config["MAIL_DEFAULT_SENDER"])


def send_email(recipient, subject, body):
    if not mail_is_configured():
        return False
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = current_app.config["MAIL_DEFAULT_SENDER"]
    message["To"] = recipient
    message.set_content(body)
    with smtplib.SMTP(current_app.config["MAIL_SERVER"], current_app.config["MAIL_PORT"], timeout=10) as server:
        if current_app.config["MAIL_USE_TLS"]:
            server.starttls()
        username = current_app.config["MAIL_USERNAME"]
        if username:
            server.login(username, current_app.config["MAIL_PASSWORD"])
        server.send_message(message)
    return True


def create_otp(user):
    code = "".join(secrets.choice(string.digits) for _ in range(6))
    now = utc_now()
    OTPCode.query.filter_by(user_id=user.id, used=False).update({"used": True})
    otp = OTPCode(
        user_id=user.id,
        code_hash=hash_code(code),
        expires_at=now + timedelta(minutes=current_app.config["OTP_EXPIRY_MINUTES"]),
        created_at=now,
    )
    db.session.add(otp)
    db.session.flush()
    return otp, code
