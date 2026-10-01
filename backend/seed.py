from app import create_app
from app.auth.services import hash_password
from app.extensions import db
from app.models import User


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
        print("Seed users are ready.")


if __name__ == "__main__":
    seed()
