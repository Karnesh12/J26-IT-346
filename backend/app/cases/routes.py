from datetime import date

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from marshmallow import Schema, ValidationError, fields, validate
from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db
from ..models import CaseFinding, CaseRecord, User, utc_now

cases_bp = Blueprint("cases", __name__)


class CreateCaseSchema(Schema):
    region = fields.String(required=True, validate=[validate.Length(min=2, max=120)])
    module = fields.String(
        required=True,
        validate=validate.OneOf(
            ["X-ray Validation", "Hand Analysis", "Leg Analysis", "Segmentation"]
        ),
    )
    side = fields.String(load_default="Right", validate=validate.OneOf(["Right", "Left"]))
    view = fields.String(load_default="AP", validate=validate.OneOf(["AP", "Lateral"]))
    study_date = fields.Date(load_default=date.today)


class UpdateFindingSchema(Schema):
    bone = fields.String(validate=validate.OneOf(["Tibia", "Fibula"]))
    location = fields.String(validate=validate.OneOf(["Shaft", "Proximal", "Distal"]))
    pattern = fields.String(
        validate=validate.OneOf(["Oblique", "Transverse", "Spiral", "Possible fracture", "No fracture"])
    )
    confidence = fields.Integer(validate=validate.Range(min=0, max=100))
    review_status = fields.String(
        validate=validate.OneOf(
            ["Pending clinician review", "Review required", "Reviewed", "Rejected"]
        )
    )
    notes = fields.String(validate=validate.Length(max=500))


def respond(success, message, data=None, errors=None, status=200):
    return jsonify(success=success, message=message, data=data, errors=errors), status


def serialize_finding(finding):
    return {
        "id": finding.id,
        "bone": finding.bone,
        "location": finding.location,
        "pattern": finding.pattern,
        "confidence": finding.confidence,
        "review_status": finding.review_status,
        "notes": finding.notes,
    }


def serialize_case(case, include_findings=False):
    data = {
        "id": case.case_id,
        "region": case.region,
        "module": case.module,
        "status": case.status,
        "updated_at": case.updated_at.isoformat(),
        "side": case.side,
        "view": case.view,
        "study_date": case.study_date.isoformat() if case.study_date else None,
        "validation_status": case.validation_status,
        "image_url": case.image_url,
    }
    if include_findings:
        data["findings"] = [serialize_finding(finding) for finding in case.findings]
    return data


def current_user():
    if get_jwt().get("purpose"):
        return None
    user = db.session.get(User, int(get_jwt_identity()))
    if user is None or not user.is_active or not user.is_approved:
        return None
    return user


def owned_case(user, case_id):
    return CaseRecord.query.filter_by(user_id=user.id, case_id=case_id).first()


def commit_case(case, message):
    case.updated_at = utc_now()
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception(message)
        return False
    return True


@cases_bp.get("")
@jwt_required()
def list_cases():
    user = current_user()
    if user is None:
        return respond(False, "Authentication required.", None, None, 401)

    query = CaseRecord.query.filter_by(user_id=user.id)
    cases = query.order_by(CaseRecord.updated_at.desc(), CaseRecord.id.desc()).limit(10).all()
    totals = db.session.query(
        db.func.count(CaseRecord.id),
        db.func.sum(
            db.case(
                (
                    CaseRecord.status.in_(
                        ["Awaiting review", "Review requested", "Segmentation requested"]
                    ),
                    1,
                ),
                else_=0,
            )
        ),
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
    user = current_user()
    if user is None:
        return respond(False, "Authentication required.", None, None, 401)

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return respond(
            False,
            "Please correct the submitted information.",
            None,
            {"_schema": ["A JSON object is required."]},
            400,
        )
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
        side=values["side"],
        view=values["view"],
        study_date=values["study_date"],
    )
    db.session.add(case)
    db.session.flush()
    case_number = case.id
    case_id = f"BV-{case_number:03d}"
    while CaseRecord.query.filter_by(case_id=case_id).first() is not None:
        case_number += 1
        case_id = f"BV-{case_number:03d}"
    case.case_id = case_id
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Unable to create research case")
        return respond(False, "Unable to create this case. Please try again.", None, None, 500)

    return respond(True, "Case created.", serialize_case(case, include_findings=True), status=201)


@cases_bp.get("/<string:case_id>")
@jwt_required()
def get_case(case_id):
    user = current_user()
    if user is None:
        return respond(False, "Authentication required.", None, None, 401)
    case = owned_case(user, case_id)
    if case is None:
        return respond(False, "Case not found.", None, None, 404)
    return respond(True, "Case loaded.", serialize_case(case, include_findings=True))


@cases_bp.patch("/<string:case_id>/findings/<int:finding_id>")
@jwt_required()
def update_finding(case_id, finding_id):
    user = current_user()
    if user is None:
        return respond(False, "Authentication required.", None, None, 401)
    case = owned_case(user, case_id)
    if case is None:
        return respond(False, "Case not found.", None, None, 404)
    finding = CaseFinding.query.filter_by(id=finding_id, case_record_id=case.id).first()
    if finding is None:
        return respond(False, "Finding not found.", None, None, 404)
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return respond(
            False,
            "Please correct the submitted information.",
            None,
            {"_schema": ["A JSON object is required."]},
            400,
        )
    try:
        values = UpdateFindingSchema().load(payload, partial=True)
    except ValidationError as error:
        return respond(False, "Please correct the submitted information.", None, error.messages, 400)
    if not values:
        return respond(False, "At least one finding field is required.", None, None, 400)

    for name, value in values.items():
        setattr(finding, name, value.strip() if name == "notes" else value)
    if not commit_case(case, "Unable to update fracture finding"):
        return respond(False, "Unable to save this finding. Please try again.", None, None, 500)
    return respond(True, "Finding saved.", serialize_finding(finding))


@cases_bp.post("/<string:case_id>/review")
@jwt_required()
def request_review(case_id):
    user = current_user()
    if user is None:
        return respond(False, "Authentication required.", None, None, 401)
    case = owned_case(user, case_id)
    if case is None:
        return respond(False, "Case not found.", None, None, 404)
    case.status = "Review requested"
    if not commit_case(case, "Unable to request case review"):
        return respond(False, "Unable to request review. Please try again.", None, None, 500)
    return respond(True, "Review requested.", serialize_case(case, include_findings=True))


@cases_bp.post("/<string:case_id>/segmentation")
@jwt_required()
def request_segmentation(case_id):
    user = current_user()
    if user is None:
        return respond(False, "Authentication required.", None, None, 401)
    case = owned_case(user, case_id)
    if case is None:
        return respond(False, "Case not found.", None, None, 404)
    case.status = "Segmentation requested"
    if not commit_case(case, "Unable to request case segmentation"):
        return respond(False, "Unable to send this case to segmentation. Please try again.", None, None, 500)
    return respond(True, "Case sent to segmentation.", serialize_case(case, include_findings=True))


@cases_bp.post("/<string:case_id>/analyze")
@jwt_required()
def analyze_case(case_id):
    user = current_user()
    if user is None:
        return respond(False, "Authentication required.", None, None, 401)
    if owned_case(user, case_id) is None:
        return respond(False, "Case not found.", None, None, 404)
    return respond(
        False,
        "The fracture-analysis model is not configured. No new predictions were generated.",
        None,
        None,
        503,
    )
