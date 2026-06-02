import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from dotenv import load_dotenv

load_dotenv()

db      = SQLAlchemy()
migrate = Migrate()
jwt     = JWTManager()
mail    = Mail()


def create_app():
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"]  = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/sportzone")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"]           = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600
    app.config["JWT_REFRESH_TOKEN_EXPIRES"]= 2592000
    app.config["MAIL_SERVER"]   = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    app.config["MAIL_PORT"]     = int(os.getenv("MAIL_PORT", 587))
    app.config["MAIL_USE_TLS"]  = True
    app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
    app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
    app.config["FRONTEND_URL"]  = os.getenv("FRONTEND_URL", "http://localhost:5173")

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    from app.routes.auth     import auth_bp
    from app.routes.tenants  import tenants_bp
    from app.routes.sports   import sports_bp
    from app.routes.events   import events_bp
    from app.routes.bookings import bookings_bp
    from app.routes.admin    import admin_bp

    app.register_blueprint(auth_bp,     url_prefix="/api/auth")
    app.register_blueprint(tenants_bp,  url_prefix="/api/tenants")
    app.register_blueprint(sports_bp,   url_prefix="/api/sports")
    app.register_blueprint(events_bp,   url_prefix="/api/events")
    app.register_blueprint(bookings_bp, url_prefix="/api/bookings")
    app.register_blueprint(admin_bp,    url_prefix="/api/admin")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "SportZone SaaS API v2"}

    return app
