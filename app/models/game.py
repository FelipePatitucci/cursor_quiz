from datetime import datetime
from app import db


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
