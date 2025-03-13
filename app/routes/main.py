from flask import Blueprint, current_app

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    return current_app.send_static_file("index.html")
