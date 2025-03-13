from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app import db
from lib.anilist import get_animes_from_user

user_bp = Blueprint("user", __name__, url_prefix="/api")


@user_bp.route("/user/profile", methods=["GET"])
@login_required
def get_user_profile():
    return jsonify(
        {
            "id": current_user.id,
            "username": current_user.username,
            "anilist_username": current_user.anilist_username,
        }
    ), 200


@user_bp.route("/user/update_anilist", methods=["POST"])
@login_required
def update_anilist_username():
    data = request.get_json()

    if not data or not data.get("anilist_username"):
        return jsonify({"error": "Anilist username is required"}), 400

    current_user.anilist_username = data["anilist_username"]
    db.session.commit()

    return jsonify({"message": "Anilist username updated successfully"}), 200


@user_bp.route("/animes", methods=["GET"])
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
