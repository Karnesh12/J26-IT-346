from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from marshmallow import Schema, ValidationError, fields, validate
from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import CaseRecord, User

cases_bp = Blueprint("cases", __name__)


class CreateCaseSchema(Schema):
    region = fields.String(required=True, validate=[validate.Length(min=2, max=120)])
    module = fields.String(
        required=True,
        validate=validate.OneOf(
            ["X-ray Validation", "Hand Analysis", "Leg Analysis", "Segmentation"]
        ),
    )


def respond(success, message, data=None, errors=None, status=200):
    return jsonify(success=success, message=message, data=data, errors=errors), status


def serialize_case(case):
    return {
        "id": case.case_id,
        "region": case.region,
        "module": case.module,
        "status": case.status,
        "updated_at": case.updated_at.isoformat(),
    }


@cases_bp.get("")
@jwt_required()
def list_cases():
    if get_jwt().get("purpose"):
        return respond(False, "Authentication required.", None, None, 401)
    user = db.session.get(User, int(get_jwt_identity()))
    if user is None or not user.is_active or not user.is_approved:
        return respond(False, "Authentication required.", None, None, 401)

    query = CaseRecord.query.filter_by(user_id=user.id)
    cases = query.order_by(CaseRecord.updated_at.desc(), CaseRecord.id.desc()).limit(10).all()
    totals = db.session.query(
        db.func.count(CaseRecord.id),
        db.func.sum(db.case((CaseRecord.status == "Awaiting review", 1), else_=0)),
        db.func.sum(db.case((CaseRecord.status == "Reviewed", 1), else_=0)),
    ).filter(CaseRecord.user_id == user.id).one()
    return respond(
        True,
        "Cases loaded.",
        {
            "cases": [serialize_case(case) for case in cases],
            "stats": {
                "total": totals[0] or 0,
                "awaiting_review": totals[1] or 0,
                "reviewed": totals[2] or 0,
            },
        },
    )


@cases_bp.post("")
@jwt_required()
def create_case():
    if get_jwt().get("purpose"):
        return respond(False, "Authentication required.", None, None, 401)
    user = db.session.get(User, int(get_jwt_identity()))
    if user is None or not user.is_active or not user.is_approved:
        return respond(False, "Authentication required.", None, None, 401)

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return respond(False, "Please correct the submitted information.", None, {"_schema": ["A JSON object is required."]}, 400)
    try:
        values = CreateCaseSchema().load(payload)
    except ValidationError as error:
        return respond(False, "Please correct the submitted information.", None, error.messages, 400)

    region = values["region"].strip()
    if not region:
        return respond(False, "Please correct the submitted information.", None, {"region": ["This field cannot be blank."]}, 400)

    case = CaseRecord(
        case_id="pending",
        user_id=user.id,
        region=region,
        module=values["module"],
    )
    db.session.add(case)
    db.session.flush()
    case.case_id = f"BV-{case.id:03d}"
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Unable to create research case")
        return respond(False, "Unable to create this case. Please try again.", None, None, 500)

    return respond(True, "Case created.", serialize_case(case), status=201)
