import unittest

from app import create_app
from app.auth.services import hash_password
from app.extensions import db
from app.models import AccessRequest, CaseRecord, User
from flask_jwt_extended import create_access_token


class TestConfig:
    TESTING = True
    DEBUG = True
    SECRET_KEY = "test-secret-key-with-more-than-32-bytes"
    JWT_SECRET_KEY = "test-jwt-secret-key-with-more-than-32-bytes"
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    FRONTEND_URL = "http://localhost:3000"
    JWT_ACCESS_TOKEN_MINUTES = 15
    JWT_REFRESH_TOKEN_DAYS = 30
    OTP_EXPIRY_MINUTES = 5
    MAIL_SERVER = ""
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = ""
    MAIL_PASSWORD = ""
    MAIL_DEFAULT_SENDER = "BoneVision AI <no-reply@example.test>"
    RATELIMIT_STORAGE_URI = "memory://"
    RATELIMIT_ENABLED = False
    TWO_FACTOR_ENABLED = True


class AuthFlowTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()
            db.session.add(
                User(
                    name="Test Researcher",
                    email="researcher@example.test",
                    password_hash=hash_password("Researcher123!"),
                    role="researcher",
                    institution="Test University",
                    is_active=True,
                    is_approved=True,
                )
            )
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_login_verification_and_authenticated_profile(self):
        login = self.client.post(
            "/api/auth/login",
            json={"email": "researcher@example.test", "password": "Researcher123!"},
        )
        self.assertEqual(login.status_code, 200)
        login_data = login.get_json()["data"]
        self.assertTrue(login_data["requires_verification"])
        self.assertEqual(len(login_data["development_otp"]), 6)

        verification = self.client.post(
            "/api/auth/verify-otp",
            json={"code": login_data["development_otp"]},
            headers={"Authorization": f"Bearer {login_data['temp_token']}"},
        )
        self.assertEqual(verification.status_code, 200)
        auth_data = verification.get_json()["data"]

        profile = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {auth_data['access_token']}"},
        )
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.get_json()["data"]["email"], "researcher@example.test")

        logout = self.client.post(
            "/api/auth/logout",
            json={"refresh_token": auth_data["refresh_token"]},
            headers={"Authorization": f"Bearer {auth_data['access_token']}"},
        )
        self.assertEqual(logout.status_code, 200)
        revoked_profile = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {auth_data['access_token']}"},
        )
        self.assertEqual(revoked_profile.status_code, 401)
        revoked_refresh = self.client.post(
            "/api/auth/refresh",
            headers={"Authorization": f"Bearer {auth_data['refresh_token']}"},
        )
        self.assertEqual(revoked_refresh.status_code, 401)

    def test_bad_credentials_are_generic_and_lock_after_five_failures(self):
        messages = []
        for _ in range(5):
            response = self.client.post(
                "/api/auth/login",
                json={"email": "researcher@example.test", "password": "WrongPassword123"},
            )
            messages.append(response.get_json()["message"])
            self.assertEqual(response.status_code, 401)
        self.assertEqual(len(set(messages)), 1)
        with self.app.app_context():
            user = User.query.filter_by(email="researcher@example.test").one()
            self.assertEqual(user.failed_attempts, 5)
            self.assertIsNotNone(user.locked_until)

        missing_user = self.client.post(
            "/api/auth/login",
            json={"email": "missing@example.test", "password": "WrongPassword123"},
        )
        self.assertEqual(missing_user.status_code, 401)
        self.assertEqual(missing_user.get_json()["message"], messages[0])

    def test_access_request_is_persisted_pending(self):
        response = self.client.post(
            "/api/auth/request-access",
            json={
                "name": "New Researcher",
                "email": "new@example.test",
                "institution": "Research University",
                "role": "researcher",
                "reason": "We are conducting a musculoskeletal imaging research study.",
            },
        )
        self.assertEqual(response.status_code, 201)
        with self.app.app_context():
            request_record = AccessRequest.query.filter_by(email="new@example.test").one()
            self.assertEqual(request_record.status, "pending")

    def test_cases_are_created_listed_and_scoped_to_authenticated_user(self):
        with self.app.app_context():
            user = User.query.filter_by(email="researcher@example.test").one()
            token = create_access_token(identity=str(user.id))
            another_user = User(
                name="Another Researcher",
                email="another@example.test",
                password_hash=hash_password("Researcher123!"),
                role="researcher",
                institution="Other University",
                is_active=True,
                is_approved=True,
            )
            db.session.add(another_user)
            db.session.commit()
            other_token = create_access_token(identity=str(another_user.id))

        unauthorized = self.client.get("/api/cases")
        self.assertEqual(unauthorized.status_code, 401)

        created = self.client.post(
            "/api/cases",
            json={"region": "Wrist (Right)", "module": "Hand Analysis"},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.get_json()["data"]["id"], "BV-001")
        self.assertEqual(created.get_json()["data"]["status"], "Awaiting review")

        listed = self.client.get("/api/cases", headers={"Authorization": f"Bearer {token}"})
        listed_data = listed.get_json()["data"]
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(listed_data["stats"], {"total": 1, "awaiting_review": 1, "reviewed": 0})
        self.assertEqual(len(listed_data["cases"]), 1)

        other_list = self.client.get("/api/cases", headers={"Authorization": f"Bearer {other_token}"})
        self.assertEqual(other_list.get_json()["data"]["stats"]["total"], 0)

    def test_case_creation_rejects_invalid_module(self):
        with self.app.app_context():
            user = User.query.filter_by(email="researcher@example.test").one()
            token = create_access_token(identity=str(user.id))
        response = self.client.post(
            "/api/cases",
            json={"region": "Wrist", "module": "Unknown"},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
