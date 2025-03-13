import os
from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import secrets

# Initialize extensions before app creation (without binding to specific app)
db = SQLAlchemy()
login_manager = LoginManager()

# Import function from original game
from lib.utils import ensure_dir_exists


def create_app(test_config=None):
    # Initialize Flask app
    app = Flask(__name__, static_folder="../frontend/build", static_url_path="/")

    # Configure the app
    app.config["SECRET_KEY"] = secrets.token_hex(16)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///anime_quiz.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize extensions with the app
    db.init_app(app)
    login_manager.init_app(app)

    # Enable CORS
    CORS(app)

    # Ensure data directories exist
    ensure_dir_exists("./data/characters/")
    ensure_dir_exists("./data/users/")
    ensure_dir_exists("./data/games/")

    with app.app_context():
        # Import models to ensure they're known to SQLAlchemy
        from app.models.user import User
        from app.models.game import Game, Guess

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
