from datetime import date

from app import create_app
from app.auth.services import hash_password
from app.extensions import db
from app.models import CaseFinding, CaseRecord, User


def seed():
    app = create_app()
    with app.app_context():
        users = [
            {
                "name": "BoneVision Administrator",
                "email": "admin@bonevision.test",
                "password": "ResearchAdmin123!",
                "role": "admin",
                "institution": "BoneVision Research",
            },
            {
                "name": "Research User",
                "email": "researcher@bonevision.test",
                "password": "Researcher123!",
                "role": "researcher",
                "institution": "BoneVision Research",
            },
        ]
        for item in users:
            existing = User.query.filter_by(email=item["email"]).first()
            if existing:
                continue
            db.session.add(
                User(
                    name=item["name"],
                    email=item["email"],
                    password_hash=hash_password(item["password"]),
                    role=item["role"],
                    institution=item["institution"],
                    is_active=True,
                    is_approved=True,
                )
            )
        db.session.commit()

        researcher = User.query.filter_by(email="researcher@bonevision.test").one()
        if not CaseRecord.query.filter_by(user_id=researcher.id).first():
            demo_case = CaseRecord(
                case_id="BV-025",
                user_id=researcher.id,
                region="Knee to ankle",
                module="Leg Analysis",
                side="Right",
                view="AP",
                study_date=date(2024, 6, 18),
                validation_status="Validation passed",
                image_url="/demo-tibia-xray.svg",
            )
            db.session.add(demo_case)
            demo_case.findings.extend(
                [
                    CaseFinding(
                        bone="Tibia",
                        location="Shaft",
                        pattern="Oblique",
                        confidence=89,
                        review_status="Pending clinician review",
                        notes="",
                    ),
                    CaseFinding(
                        bone="Fibula",
                        location="Shaft",
                        pattern="Possible fracture",
                        confidence=62,
                        review_status="Review required",
                        notes="",
                    ),
                ]
            )
            db.session.commit()
        print("Seed users are ready.")


if __name__ == "__main__":
    seed()
