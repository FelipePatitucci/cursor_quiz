import os
from datetime import timedelta

import secrets
from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session

from app.utils.utils import ensure_dir_exists

# Initialize extensions before app creation (without binding to specific app)
db = SQLAlchemy()
login_manager = LoginManager()
sess = Session()

def create_app(test_config=None):
    # Initialize Flask app
    app = Flask(__name__, static_folder="../frontend/build", static_url_path="/")

    # Configure the app
    app.config["SECRET_KEY"] = secrets.token_hex(16)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///anime_quiz.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Ensure the session directory exists
    os.makedirs("flask_session", exist_ok=True)

    # Session configuration
    app.config["SESSION_TYPE"] = "filesystem"
    app.config["SESSION_FILE_DIR"] = "flask_session"
    app.config["SESSION_PERMANENT"] = True
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=2)
    app.config["SESSION_COOKIE_SECURE"] = False  # Set to True in production with HTTPS
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_USE_SIGNER"] = True

    # Initialize extensions with the app
    db.init_app(app)
    login_manager.init_app(app)
    sess.init_app(app)

    # Enable CORS with credentials support
    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}})

    # Ensure data directories exist
    ensure_dir_exists("./data/characters/")
    ensure_dir_exists("./data/users/")
    ensure_dir_exists("./data/games/")

    with app.app_context():
        # Import models to ensure they're known to SQLAlchemy
        # from app.models.user import User
        # from app.models.game import Game, Guess

        # Create database tables
        db.create_all()

        # Import and register blueprints
        from app.routes.auth import auth_bp
        from app.routes.user import user_bp
        from app.routes.game import game_bp
        from app.routes.main import main_bp

        app.register_blueprint(auth_bp)
        app.register_blueprint(user_bp)
        app.register_blueprint(game_bp)
        app.register_blueprint(main_bp)

        return app
