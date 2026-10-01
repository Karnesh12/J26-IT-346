from marshmallow import Schema, ValidationError, fields, validate


def password_byte_length(value):
    try:
        byte_length = len(value.encode("utf-8"))
    except UnicodeEncodeError as error:
        raise ValidationError("Password contains an invalid character.") from error
    if byte_length > 72:
        raise ValidationError("Password must be at most 72 UTF-8 bytes.")


def non_whitespace(value):
    if not value.strip():
        raise ValidationError("This field cannot be blank.")


class LoginSchema(Schema):
    email = fields.Email(required=True, validate=validate.Length(max=254))
    password = fields.String(required=True, validate=[validate.Length(min=8, max=72), password_byte_length])


class OtpSchema(Schema):
    code = fields.String(required=True, validate=validate.Regexp(r"^\d{6}$"))


class AccessRequestSchema(Schema):
    name = fields.String(required=True, validate=[validate.Length(min=2, max=160), non_whitespace])
    email = fields.Email(required=True, validate=validate.Length(max=254))
    institution = fields.String(required=True, validate=[validate.Length(min=2, max=200), non_whitespace])
    role = fields.String(required=True, validate=validate.OneOf(["researcher", "reviewer"]))
    reason = fields.String(required=True, validate=[validate.Length(min=20, max=1000), non_whitespace])


class EmailSchema(Schema):
    email = fields.Email(required=True, validate=validate.Length(max=254))


class ResetPasswordSchema(Schema):
    password = fields.String(required=True, validate=[validate.Length(min=8, max=72), password_byte_length])


def validate_payload(schema, payload):
    return schema.load(payload)
