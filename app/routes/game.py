import json
import os
import time
import traceback
from datetime import datetime

from flask import Blueprint, jsonify, request, session, send_file
from flask_login import login_required, current_user

from app import db
from app.models.user import User
from app.models.game import Game, Guess
from app.utils.anilist import prepare_for_game_anilist, get_characters_from_anime

game_bp = Blueprint("game", __name__, url_prefix="/api")


@game_bp.route("/game/state", methods=["GET"])
@login_required
def game_state():
    """Get the current game state for debugging."""
    if "game_id" not in session:
        return jsonify({"active": False, "message": "No active game"}), 200

    game_id = session.get("game_id")
    game = Game.query.get(game_id)

    if not game or game.user_id != current_user.id:
        # Clear invalid session data
        session.pop("game_id", None)
        session.pop("map_char_and_names", None)
        session.pop("map_index_to_infos", None)
        session.pop("guessed_indexes", None)
        return jsonify({"active": False, "message": "No valid game found"}), 200

    return jsonify(
        {
            "active": True,
            "game_id": game_id,
            "anime_title": game.anime_title,
            "total_characters": game.total_characters,
            "correct_guesses": game.correct_guesses,
            "total_guesses": game.total_guesses,
            "completed": game.completed,
            "score": game.score,
        }
    ), 200


@game_bp.route("/game/start", methods=["POST"])
@login_required
def start_game():
    # Clear any existing game session data first
    session.pop("game_id", None)
    session.pop("map_char_and_names", None)
    session.pop("map_index_to_infos", None)
    session.pop("guessed_indexes", None)

    data = request.get_json()

    if not data or not data.get("anime_id") or not data.get("anime_title"):
        return jsonify({"error": "Anime ID and title are required"}), 400

    try:
        # Get character data for the selected anime
        anime_id = int(data["anime_id"])  # Ensure anime_id is an integer
        print(f"Starting game for anime ID: {anime_id}, title: {data['anime_title']}")

        map_char_and_names, map_index_to_infos = prepare_for_game_anilist(
            anime_id=anime_id, favourite_cut=5
        )

        if not map_index_to_infos or len(map_index_to_infos) == 0:
            print("No character data found for anime")
            return jsonify({"error": "No character data found for this anime"}), 400

        # Create a new game
        game = Game(
            user_id=current_user.id,
            anime_id=anime_id,
            anime_title=data["anime_title"],
            total_characters=len(map_index_to_infos),
        )

        db.session.add(game)
        db.session.commit()

        print(
            f"Created game with ID: {game.id}, total characters: {game.total_characters}"
        )

        # Store game data in session
        session["game_id"] = game.id
        session["map_char_and_names"] = map_char_and_names
        session["map_index_to_infos"] = {
            str(k): v for k, v in map_index_to_infos.items()
        }
        session["guessed_indexes"] = []

        # Ensure session is saved
        session.modified = True
        print(f"Session set: game_id={session.get('game_id')}")

        return jsonify(
            {
                "message": "Game started successfully",
                "game_id": game.id,
                "anime_title": game.anime_title,
                "total_characters": game.total_characters,
            }
        ), 201
    except Exception as e:
        print(f"Error starting game: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Failed to start game: {str(e)}"}), 500


@game_bp.route("/game/guess", methods=["POST"])
@login_required
def make_guess():
    print(f"Current session: game_id={session.get('game_id')}")

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
    guessed_indexes = session.get("guessed_indexes", [])

    print(f"Processing guess: '{user_input}' for game {game_id}")
    print(
        f"Session data: characters={len(map_char_and_names)}, indices={len(guessed_indexes)}"
    )

    # Process the guess
    game.total_guesses += 1
    is_correct = False
    character_name = None
    idx_str = None

    if user_input in map_char_and_names:
        # Correct guess
        idx = map_char_and_names[user_input]
        idx_str = str(idx)

        if idx not in guessed_indexes:
            is_correct = True
            entry = map_index_to_infos[idx_str]
            character_name = entry["names"][0]

            # Update score based on character role
            scores = {"MAIN": 3, "SUPPORTING": 1}
            game.score += scores[entry["role"]]
            game.correct_guesses += 1

            # Add to guessed indices
            guessed_indexes.append(idx)
            session["guessed_indexes"] = guessed_indexes

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
        session.pop("guessed_indexes", None)

    db.session.commit()

    # Ensure session is saved
    session.modified = True

    return jsonify(
        {
            "is_correct": is_correct,
            "character_name": character_name,
            "native_name": map_index_to_infos[idx_str]["names"][-1]
            if is_correct and idx_str
            else None,
            "total_guesses": game.total_guesses,
            "correct_guesses": game.correct_guesses,
            "total_characters": game.total_characters,
            "score": game.score,
            "completed": game.completed,
        }
    ), 200


@game_bp.route("/game/end", methods=["POST"])
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
    session.pop("guessed_indexes", None)

    db.session.commit()

    return jsonify({"message": "Game ended successfully", "game": game.to_dict()}), 200


@game_bp.route("/games", methods=["GET"])
@login_required
def get_games():
    games = (
        Game.query.filter_by(user_id=current_user.id)
        .order_by(Game.start_time.desc())
        .all()
    )
    return jsonify({"games": [game.to_dict() for game in games]}), 200


@game_bp.route("/game/<int:game_id>", methods=["GET"])
@login_required
def get_game(game_id):
    game = Game.query.get(game_id)

    if not game or game.user_id != current_user.id:
        return jsonify({"error": "Game not found"}), 404

    return jsonify({"game": game.to_dict()}), 200


@game_bp.route("/game/export/<int:game_id>", methods=["GET"])
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


@game_bp.route("/leaderboard", methods=["GET"])
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


@game_bp.route("/game/characters/<int:game_id>", methods=["GET"])
@login_required
def get_game_characters(game_id):
    """Get all characters for a completed game, showing which were guessed correctly."""
    game = Game.query.get(game_id)

    if not game or game.user_id != current_user.id:
        return jsonify({"error": "Game not found"}), 404

    # Get all guesses for this game
    guesses = Guess.query.filter_by(game_id=game_id).all()
    correct_guesses = [g.character_name for g in guesses if int(g.is_correct)]

    # Get all characters for this anime
    try:
        character_data = get_characters_from_anime(anime_id=game.anime_id)
        all_characters = []

        for char in character_data["data"]:
            names = char["name"]
            first_name = names["first"] if names["first"] is not None else ""
            last_name = names["last"] if names["last"] is not None else ""
            display_name = f"{last_name} {first_name}".strip()

            # Check if this character was guessed correctly
            was_guessed = any(
                guess.lower() == display_name.lower() for guess in correct_guesses
            )

            all_characters.append(
                {
                    "id": char["id"],
                    "name": display_name,
                    "native_name": names.get("native", ""),
                    "image": char["image"],
                    "role": char["role"],
                    "favourites": char["favourites"],
                    "was_guessed": was_guessed,
                }
            )

        return jsonify(
            {
                "game_id": game_id,
                "anime_title": game.anime_title,
                "total_characters": len(all_characters),
                "characters": all_characters,
                "correct_guesses": game.correct_guesses,
                "total_guesses": game.total_guesses,
                "score": game.score,
                "completed": game.completed,
            }
        ), 200

    except Exception as e:
        print(f"Error retrieving characters: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Failed to retrieve characters: {str(e)}"}), 500
