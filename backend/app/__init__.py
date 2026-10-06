import os

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from sqlalchemy import text

from .config import Config
from .extensions import cors_limiter, db, jwt, migrate


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    secret_keys = (app.config["SECRET_KEY"], app.config["JWT_SECRET_KEY"])
    if not app.config["DEBUG"] and any(
        len(secret) < 32 or secret.startswith("replace-with-") for secret in secret_keys
    ):
        raise RuntimeError("Set SECRET_KEY and JWT_SECRET_KEY before running outside development mode.")
    from datetime import timedelta

    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(
        minutes=app.config["JWT_ACCESS_TOKEN_MINUTES"]
    )
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(
        days=app.config["JWT_REFRESH_TOKEN_DAYS"]
    )
    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors_limiter.init_app(app)
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["FRONTEND_URL"]}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "OPTIONS"],
    )

    from . import models
    from .auth.routes import auth_bp
    from .cases.routes import cases_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(cases_bp, url_prefix="/api/cases")

    @jwt.token_in_blocklist_loader
    def token_is_revoked(_header, payload):
        from .models import RevokedToken

        return db.session.query(RevokedToken.id).filter_by(jti=payload["jti"]).first() is not None

    @jwt.unauthorized_loader
    def missing_token(_reason):
        return jsonify(success=False, message="Authentication required.", data=None, errors=None), 401

    @jwt.invalid_token_loader
    def invalid_token(_reason):
        return jsonify(success=False, message="Invalid authentication token.", data=None, errors=None), 401

    @jwt.expired_token_loader
    def expired_token(_header, _payload):
        return jsonify(success=False, message="Authentication token expired.", data=None, errors=None), 401

    @app.get("/api/health")
    def health():
        try:
            db.session.execute(text("SELECT 1"))
        except Exception:
            app.logger.exception("Database health check failed")
            return jsonify(success=False, message="Service unavailable.", data=None, errors=None), 503
        return jsonify(success=True, message="Service is healthy.", data={"status": "ok"}, errors=None)

    @app.errorhandler(HTTPException)
    def http_error(error):
        message = "Too many requests. Please try again later." if error.code == 429 else error.description
        return jsonify(success=False, message=message, data=None, errors=None), error.code

    @app.errorhandler(Exception)
    def unexpected_error(error):
        db.session.rollback()
        app.logger.exception("Unhandled API error", exc_info=error)
        return jsonify(success=False, message="An unexpected server error occurred.", data=None, errors=None), 500

    return app
