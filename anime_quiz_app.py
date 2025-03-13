from flask import Flask, jsonify, request, session, send_file
from flask_cors import CORS
from flask_login import (
    LoginManager,
    login_user,
    logout_user,
    login_required,
    current_user,
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
import time
from datetime import datetime
import secrets

# Import libraries from the original game
from lib.anilist import get_animes_from_user, prepare_for_game_anilist
from lib.utils import ensure_dir_exists

# Initialize Flask app
app = Flask(__name__, static_folder="frontend/build", static_url_path="/")
app.config["SECRET_KEY"] = secrets.token_hex(16)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///anime_quiz.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Enable CORS
CORS(app)

# Initialize database
db = SQLAlchemy(app)

# Initialize login manager
login_manager = LoginManager()
login_manager.init_app(app)

# Ensure data directories exist
ensure_dir_exists("./data/characters/")
ensure_dir_exists("./data/users/")
ensure_dir_exists("./data/games/")


# Define models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    anilist_username = db.Column(db.String(80), nullable=True)
    games = db.relationship("Game", backref="user", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        return str(self.id)

    @property
    def is_active(self):
        return True

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False


class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    anime_id = db.Column(db.Integer, nullable=False)
    anime_title = db.Column(db.String(200), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    total_guesses = db.Column(db.Integer, nullable=False, default=0)
    correct_guesses = db.Column(db.Integer, nullable=False, default=0)
    total_characters = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Integer, nullable=False, default=0)
    completed = db.Column(db.Boolean, nullable=False, default=False)
    guesses = db.relationship("Guess", backref="game", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "anime_id": self.anime_id,
            "anime_title": self.anime_title,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "total_guesses": self.total_guesses,
            "correct_guesses": self.correct_guesses,
            "total_characters": self.total_characters,
            "score": self.score,
            "completed": self.completed,
            "duration": (self.end_time - self.start_time).total_seconds()
            if self.end_time
            else None,
            "guesses": [guess.to_dict() for guess in self.guesses],
        }


class Guess(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey("game.id"), nullable=False)
    guess_text = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_correct = db.Column(db.Boolean, nullable=False)
    character_name = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "guess_text": self.guess_text,
            "timestamp": self.timestamp.isoformat(),
            "is_correct": self.is_correct,
            "character_name": self.character_name,
        }


# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# Create database tables
with app.app_context():
    db.create_all()


# Define API routes
@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password are required"}), 400

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 400

    user = User(username=data["username"])
    user.set_password(data["password"])

    if data.get("anilist_username"):
        user.anilist_username = data["anilist_username"]

    db.session.add(user)
    db.session.commit()

    login_user(user)

    return jsonify({"message": "User registered successfully", "user_id": user.id}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(username=data["username"]).first()

    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid username or password"}), 401

    login_user(user)

    return jsonify({"message": "Login successful", "user_id": user.id}), 200


@app.route("/api/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logout successful"}), 200


@app.route("/api/user/profile", methods=["GET"])
@login_required
def get_user_profile():
    return jsonify(
        {
            "id": current_user.id,
            "username": current_user.username,
            "anilist_username": current_user.anilist_username,
        }
    ), 200


@app.route("/api/user/update_anilist", methods=["POST"])
@login_required
def update_anilist_username():
    data = request.get_json()

    if not data or not data.get("anilist_username"):
        return jsonify({"error": "Anilist username is required"}), 400

    current_user.anilist_username = data["anilist_username"]
    db.session.commit()

    return jsonify({"message": "Anilist username updated successfully"}), 200


@app.route("/api/animes", methods=["GET"])
@login_required
def get_animes():
    if not current_user.anilist_username:
        return jsonify({"error": "Anilist username not set"}), 400

    try:
        user_list = get_animes_from_user(username=current_user.anilist_username)

        animes = []
        for status in user_list["animeList"]["allStatus"]:
            status_animes = user_list["animeList"].get(status, [])
            for anime in status_animes:
                animes.append(
                    {
                        "id": anime["media"]["id"],
                        "title": anime["media"]["title"],
                        "status": status,
                        "episodes": anime["media"]["episodes"],
                        "score": anime["score"],
                    }
                )

        return jsonify({"animes": animes}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/game/start", methods=["POST"])
@login_required
def start_game():
    data = request.get_json()

    if not data or not data.get("anime_id") or not data.get("anime_title"):
        return jsonify({"error": "Anime ID and title are required"}), 400

    try:
        # Get character data for the selected anime
        map_char_and_names, map_index_to_infos = prepare_for_game_anilist(
            anime_id=data["anime_id"], favourite_cut=5
        )

        # Create a new game
        game = Game(
            user_id=current_user.id,
            anime_id=data["anime_id"],
            anime_title=data["anime_title"],
            total_characters=len(map_index_to_infos),
        )

        db.session.add(game)
        db.session.commit()

        # Store game data in session
        session["game_id"] = game.id
        session["map_char_and_names"] = map_char_and_names
        session["map_index_to_infos"] = {
            str(k): v for k, v in map_index_to_infos.items()
        }
        session["guessed_indices"] = []

        return jsonify(
            {
                "message": "Game started successfully",
                "game_id": game.id,
                "anime_title": game.anime_title,
                "total_characters": game.total_characters,
            }
        ), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/game/guess", methods=["POST"])
@login_required
def make_guess():
    if "game_id" not in session:
        return jsonify({"error": "No active game"}), 400

    data = request.get_json()

    if not data or not data.get("guess"):
        return jsonify({"error": "Guess is required"}), 400

    game_id = session["game_id"]
    game = Game.query.get(game_id)

    if not game or game.user_id != current_user.id:
        return jsonify({"error": "Game not found"}), 404

    if game.completed:
        return jsonify({"error": "Game already completed"}), 400

    user_input = data["guess"].strip().lower()
    map_char_and_names = session.get("map_char_and_names", {})
    map_index_to_infos = session.get("map_index_to_infos", {})
    guessed_indices = session.get("guessed_indices", [])

    # Process the guess
    game.total_guesses += 1
    is_correct = False
    character_name = None

    if user_input in map_char_and_names:
        # Correct guess
        idx = map_char_and_names[user_input]
        idx_str = str(idx)

        if idx not in guessed_indices:
            is_correct = True
            entry = map_index_to_infos[idx_str]
            character_name = entry["names"][0]

            # Update score based on character role
            scores = {"MAIN": 3, "SUPPORTING": 1}
            game.score += scores[entry["role"]]
            game.correct_guesses += 1

            # Add to guessed indices
            guessed_indices.append(idx)
            session["guessed_indices"] = guessed_indices

            # Remove all variations for the guessed character
            for name in entry["names"]:
                if name.lower() in map_char_and_names:
                    del map_char_and_names[name.lower()]

            session["map_char_and_names"] = map_char_and_names

    # Record the guess
    guess = Guess(
        game_id=game_id,
        guess_text=user_input,
        is_correct=is_correct,
        character_name=character_name,
    )

    db.session.add(guess)

    # Check if game is completed
    if game.correct_guesses >= game.total_characters:
        game.completed = True
        game.end_time = datetime.utcnow()

        # Clear game session data
        session.pop("game_id", None)
        session.pop("map_char_and_names", None)
        session.pop("map_index_to_infos", None)
        session.pop("guessed_indices", None)

    db.session.commit()

    return jsonify(
        {
            "is_correct": is_correct,
            "character_name": character_name,
            "native_name": map_index_to_infos[idx_str]["names"][-1]
            if is_correct
            else None,
            "total_guesses": game.total_guesses,
            "correct_guesses": game.correct_guesses,
            "total_characters": game.total_characters,
            "score": game.score,
            "completed": game.completed,
        }
    ), 200


@app.route("/api/game/end", methods=["POST"])
@login_required
def end_game():
    if "game_id" not in session:
        return jsonify({"error": "No active game"}), 400

    game_id = session["game_id"]
    game = Game.query.get(game_id)

    if not game or game.user_id != current_user.id:
        return jsonify({"error": "Game not found"}), 404

    if game.completed:
        return jsonify({"error": "Game already completed"}), 400

    game.completed = True
    game.end_time = datetime.utcnow()

    # Clear game session data
    session.pop("game_id", None)
    session.pop("map_char_and_names", None)
    session.pop("map_index_to_infos", None)
    session.pop("guessed_indices", None)

    db.session.commit()

    return jsonify({"message": "Game ended successfully", "game": game.to_dict()}), 200


@app.route("/api/games", methods=["GET"])
@login_required
def get_games():
    games = (
        Game.query.filter_by(user_id=current_user.id)
        .order_by(Game.start_time.desc())
        .all()
    )
    return jsonify({"games": [game.to_dict() for game in games]}), 200


@app.route("/api/game/<int:game_id>", methods=["GET"])
@login_required
def get_game(game_id):
    game = Game.query.get(game_id)

    if not game or game.user_id != current_user.id:
        return jsonify({"error": "Game not found"}), 404

    return jsonify({"game": game.to_dict()}), 200


@app.route("/api/game/export/<int:game_id>", methods=["GET"])
@login_required
def export_game(game_id):
    game = Game.query.get(game_id)

    if not game or game.user_id != current_user.id:
        return jsonify({"error": "Game not found"}), 404

    # Create export data
    export_data = game.to_dict()

    # Save to file
    filename = f"game_{game_id}_{int(time.time())}.json"
    filepath = os.path.join("./data/games/", filename)

    with open(filepath, "w") as f:
        json.dump(export_data, f, indent=2)

    return send_file(filepath, as_attachment=True)


@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    # Get top 10 games by score
    top_games = (
        Game.query.filter_by(completed=True).order_by(Game.score.desc()).limit(10).all()
    )

    leaderboard = []
    for game in top_games:
        user = User.query.get(game.user_id)
        leaderboard.append(
            {
                "username": user.username,
                "anime_title": game.anime_title,
                "score": game.score,
                "correct_guesses": game.correct_guesses,
                "total_characters": game.total_characters,
                "date": game.end_time.strftime("%Y-%m-%d"),
            }
        )

    return jsonify({"leaderboard": leaderboard}), 200


# Run the app
if __name__ == "__main__":
    app.run(debug=True, port=5000)
