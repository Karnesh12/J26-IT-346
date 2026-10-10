from datetime import datetime, timezone

from .extensions import db


def utc_now():
    return datetime.now(timezone.utc)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    email = db.Column(db.String(254), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="researcher")
    institution = db.Column(db.String(200), nullable=False, default="")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_approved = db.Column(db.Boolean, nullable=False, default=True)
    failed_attempts = db.Column(db.Integer, nullable=False, default=0)
    locked_until = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
    otp_codes = db.relationship("OTPCode", back_populates="user", cascade="all, delete-orphan")


class OTPCode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    code_hash = db.Column(db.String(128), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    attempts = db.Column(db.Integer, nullable=False, default=0)
    used = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
    user = db.relationship("User", back_populates="otp_codes")


class AccessRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    email = db.Column(db.String(254), nullable=False, index=True)
    institution = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    reason = db.Column(db.String(1000), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)


class CaseRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.String(20), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    region = db.Column(db.String(120), nullable=False)
    module = db.Column(db.String(40), nullable=False)
    status = db.Column(db.String(24), nullable=False, default="Awaiting review")
    side = db.Column(db.String(12), nullable=False, default="Right")
    view = db.Column(db.String(12), nullable=False, default="AP")
    study_date = db.Column(db.Date, nullable=True)
    validation_status = db.Column(db.String(32), nullable=False, default="Validation passed")
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)
    findings = db.relationship("CaseFinding", back_populates="case", cascade="all, delete-orphan", order_by="CaseFinding.id")


class CaseFinding(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_record_id = db.Column(db.Integer, db.ForeignKey("case_record.id"), nullable=False, index=True)
    bone = db.Column(db.String(40), nullable=False)
    location = db.Column(db.String(40), nullable=False)
    pattern = db.Column(db.String(40), nullable=False)
    confidence = db.Column(db.Integer, nullable=False)
    review_status = db.Column(db.String(40), nullable=False, default="Pending clinician review")
    notes = db.Column(db.String(500), nullable=False, default="")
    case = db.relationship("CaseRecord", back_populates="findings")


class RevokedToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), unique=True, nullable=False, index=True)
    revoked_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
