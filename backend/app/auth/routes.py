import secrets
import smtplib
from datetime import timedelta

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from flask_jwt_extended.exceptions import JWTExtendedException
from marshmallow import ValidationError
from sqlalchemy import func

from ..extensions import cors_limiter, db
from ..models import AccessRequest, OTPCode, RevokedToken, User, utc_now
from .schemas import (
    AccessRequestSchema,
    EmailSchema,
    LoginSchema,
    OtpSchema,
    ResetPasswordSchema,
    validate_payload,
)
from .services import create_otp, hash_password, mail_is_configured, send_email, verify_code, verify_password

auth_bp = Blueprint("auth", __name__)


def respond(success, message, data=None, errors=None, status=200):
    return jsonify(success=success, message=message, data=data, errors=errors), status


def input_payload():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ValidationError({"_schema": ["A JSON object is required."]})
    return payload


def validation_error(error):
    return respond(False, "Please correct the submitted information.", None, error.messages, 400)


def token_pair(user):
    identity = str(user.id)
    claims = {"role": user.role}
    return {
        "access_token": create_access_token(identity=identity, additional_claims=claims),
        "refresh_token": create_refresh_token(identity=identity, additional_claims=claims),
    }


def mail_failure():
    db.session.rollback()
    current_app.logger.exception("Unable to deliver an authentication email")
    return respond(False, "Unable to send verification instructions. Please try again later.", None, None, 503)


@auth_bp.post("/login")
@cors_limiter.limit("5 per minute")
def login():
    try:
        values = validate_payload(LoginSchema(), input_payload())
    except ValidationError as error:
        return validation_error(error)

    email = values["email"].strip().lower()
    user = User.query.filter(func.lower(User.email) == email).first()
    now = utc_now()
    if not user:
        return respond(False, "Invalid email or password.", None, None, 401)

    locked_until = user.locked_until
    if locked_until and locked_until.replace(tzinfo=now.tzinfo) > now:
        return respond(False, "Invalid email or password.", None, None, 401)
    if locked_until:
        user.locked_until = None
        user.failed_attempts = 0

    if not verify_password(values["password"], user.password_hash) or not user.is_active or not user.is_approved:
        user.failed_attempts += 1
        if user.failed_attempts >= 5:
            user.failed_attempts = 5
            user.locked_until = now + timedelta(minutes=15)
        db.session.commit()
        return respond(False, "Invalid email or password.", None, None, 401)

    user.failed_attempts = 0
    user.locked_until = None
    if current_app.config["TWO_FACTOR_ENABLED"]:
        otp, code = create_otp(user)
        try:
            email_sent = send_email(
                user.email,
                "Your BoneVision AI verification code",
                f"Your BoneVision AI verification code is {code}. It expires in {current_app.config['OTP_EXPIRY_MINUTES']} minutes.",
            )
        except (OSError, smtplib.SMTPException):
            return mail_failure()
        if not email_sent and not current_app.debug:
            db.session.rollback()
            current_app.logger.error("Authentication email delivery is not configured")
            return respond(False, "Unable to send verification instructions. Please try again later.", None, None, 503)
        db.session.commit()
        response_data = {
            "requires_verification": True,
            "temp_token": create_access_token(
                identity=str(user.id),
                additional_claims={"purpose": "otp", "otp_id": otp.id},
                expires_delta=timedelta(minutes=current_app.config["OTP_EXPIRY_MINUTES"]),
            ),
        }
        if current_app.debug and not email_sent:
            response_data["development_otp"] = code
        return respond(True, "Verification code sent.", response_data)

    db.session.commit()
    return respond(True, "Signed in.", token_pair(user))


def current_otp(payload):
    if payload.get("purpose") != "otp" or not payload.get("otp_id"):
        return None
    return db.session.get(OTPCode, payload["otp_id"])


@auth_bp.post("/verify-otp")
@cors_limiter.limit("10 per minute")
@jwt_required()
def verify_otp():
    try:
        values = validate_payload(OtpSchema(), input_payload())
    except ValidationError as error:
        return validation_error(error)

    payload = get_jwt()
    otp = current_otp(payload)
    user = db.session.get(User, int(get_jwt_identity()))
    now = utc_now()
    if (
        otp is None
        or user is None
        or otp.user_id != user.id
        or otp.used
        or otp.attempts >= 5
        or otp.expires_at.replace(tzinfo=now.tzinfo) <= now
    ):
        return respond(False, "The verification code is invalid or expired.", None, None, 401)

    otp.attempts += 1
    if not verify_code(values["code"], otp.code_hash):
        if otp.attempts >= 5:
            otp.used = True
        db.session.commit()
        return respond(False, "The verification code is invalid or expired.", None, None, 401)

    otp.used = True
    db.session.add(RevokedToken(jti=payload["jti"]))
    db.session.commit()
    return respond(True, "Email verified.", token_pair(user))


@auth_bp.post("/resend-otp")
@cors_limiter.limit("3 per minute")
@jwt_required()
def resend_otp():
    payload = get_jwt()
    if payload.get("purpose") != "otp":
        return respond(False, "Verification session is invalid.", None, None, 401)
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or not user.is_active or not user.is_approved:
        return respond(False, "Verification session is invalid.", None, None, 401)

    now = utc_now()
    latest = OTPCode.query.filter_by(user_id=user.id).order_by(OTPCode.created_at.desc()).first()
    if latest and (now - latest.created_at.replace(tzinfo=now.tzinfo)).total_seconds() < 30:
        return respond(False, "Please wait before requesting another code.", None, None, 429)
    otp, code = create_otp(user)
    try:
        email_sent = send_email(
            user.email,
            "Your BoneVision AI verification code",
            f"Your BoneVision AI verification code is {code}. It expires in {current_app.config['OTP_EXPIRY_MINUTES']} minutes.",
        )
    except (OSError, smtplib.SMTPException):
        return mail_failure()
    if not email_sent and not current_app.debug:
        db.session.rollback()
        current_app.logger.error("Authentication email delivery is not configured")
        return respond(False, "Unable to send verification instructions. Please try again later.", None, None, 503)
    db.session.commit()
    result = {}
    if current_app.debug and not email_sent:
        result["development_otp"] = code
    result["temp_token"] = create_access_token(
        identity=str(user.id),
        additional_claims={"purpose": "otp", "otp_id": otp.id},
        expires_delta=timedelta(minutes=current_app.config["OTP_EXPIRY_MINUTES"]),
    )
    return respond(True, "A new verification code was sent.", result)


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user = db.session.get(User, int(get_jwt_identity()))
    if user is None or not user.is_active or not user.is_approved:
        return respond(False, "Authentication required.", None, None, 401)
    old_token = get_jwt()
    db.session.add(RevokedToken(jti=old_token["jti"]))
    db.session.commit()
    return respond(True, "Session refreshed.", token_pair(user))


@auth_bp.post("/logout")
@jwt_required()
def logout():
    token_payload = get_jwt()
    if token_payload.get("purpose"):
        return respond(False, "Authentication required.", None, None, 401)
    db.session.add(RevokedToken(jti=token_payload["jti"]))
    refresh_token = (request.get_json(silent=True) or {}).get("refresh_token")
    if isinstance(refresh_token, str) and refresh_token:
        try:
            refresh_payload = decode_token(refresh_token)
        except JWTExtendedException:
            current_app.logger.info("Ignoring an invalid or expired refresh token during logout")
        else:
            if refresh_payload.get("type") == "refresh" and refresh_payload.get("sub") == get_jwt_identity():
                if not RevokedToken.query.filter_by(jti=refresh_payload["jti"]).first():
                    db.session.add(RevokedToken(jti=refresh_payload["jti"]))
    db.session.commit()
    return respond(True, "Signed out.", {})


@auth_bp.post("/forgot-password")
@cors_limiter.limit("5 per hour")
def forgot_password():
    try:
        values = validate_payload(EmailSchema(), input_payload())
    except ValidationError as error:
        return validation_error(error)
    user = User.query.filter(func.lower(User.email) == values["email"].strip().lower()).first()
    if user and user.is_active and user.is_approved:
        reset_token = create_access_token(
            identity=str(user.id),
            additional_claims={"purpose": "password_reset", "nonce": secrets.token_urlsafe(16)},
            expires_delta=timedelta(hours=1),
        )
        try:
            send_email(
                user.email,
                "Reset your BoneVision AI password",
                f"Use this password-reset token to choose a new password:\n\n{reset_token}\n\nThis token expires in one hour.",
            )
        except (OSError, smtplib.SMTPException):
            current_app.logger.exception("Unable to send a password reset email")
            return respond(True, "If an account matches that email, reset instructions will be sent shortly.", {})
        if not mail_is_configured() and not current_app.debug:
            current_app.logger.error("Password reset email delivery is not configured")
        if current_app.debug and not mail_is_configured():
            current_app.logger.info("Development password reset token: %s", reset_token)
    return respond(True, "If an account matches that email, reset instructions will be sent shortly.", {})


@auth_bp.post("/reset-password")
@jwt_required()
def reset_password():
    payload = get_jwt()
    if payload.get("purpose") != "password_reset":
        return respond(False, "Password reset session is invalid or expired.", None, None, 401)
    try:
        values = validate_payload(ResetPasswordSchema(), input_payload())
    except ValidationError as error:
        return validation_error(error)
    user = db.session.get(User, int(get_jwt_identity()))
    if user is None or not user.is_active:
        return respond(False, "Password reset session is invalid or expired.", None, None, 401)
    user.password_hash = hash_password(values["password"])
    user.failed_attempts = 0
    user.locked_until = None
    db.session.add(RevokedToken(jti=payload["jti"]))
    db.session.commit()
    return respond(True, "Password has been reset.", {})


@auth_bp.post("/request-access")
@cors_limiter.limit("5 per hour")
def request_access():
    try:
        values = validate_payload(AccessRequestSchema(), input_payload())
    except ValidationError as error:
        return validation_error(error)
    access_request = AccessRequest(
        name=values["name"].strip(),
        email=values["email"].strip().lower(),
        institution=values["institution"].strip(),
        role=values["role"],
        reason=values["reason"].strip(),
        status="pending",
    )
    db.session.add(access_request)
    db.session.commit()
    return respond(True, "Your access request was submitted for review.", {"status": "pending"}, status=201)


@auth_bp.get("/sso/start")
def sso_start():
    return respond(False, "Institution sign-in is not configured yet.", None, None, 501)


@auth_bp.get("/sso/callback")
def sso_callback():
    return respond(False, "Institution sign-in is not configured yet.", None, None, 501)


@auth_bp.get("/me")
@jwt_required()
def me():
    if get_jwt().get("purpose"):
        return respond(False, "Authentication required.", None, None, 401)
    user = db.session.get(User, int(get_jwt_identity()))
    if user is None or not user.is_active or not user.is_approved:
        return respond(False, "Authentication required.", None, None, 401)
    return respond(
        True,
        "Current user.",
        {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "institution": user.institution},
    )
