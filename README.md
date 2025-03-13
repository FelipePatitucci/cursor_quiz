# 🎮 Anime Character Guessing Game

A web application for guessing anime characters based on your AniList anime watchlist.

## Features

- **User Authentication:** Register and login to the application.
- **AniList Integration:** Link your AniList account to access your anime watchlist.
- **Anime Selection:** Choose any anime from your watchlist to play.
- **Character Guessing:** Guess character names from the selected anime.
- **Score Tracking:** Keep track of your score and progress.
- **Game History:** View your past games and performance.
- **Game Results Export:** Export your game results as a JSON file.
- **Leaderboard:** Compare your scores with other players.

## Technologies Used

- **Backend:** Flask (Python)
- **Frontend:** React.js
- **Database:** SQLite with SQLAlchemy
- **API:** AniList GraphQL API

## Installation

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd anime-quiz
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Run the Flask application:
   ```
   python anime_quiz_app.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Build for production:
   ```
   npm run build
   ```

## How to Play

1. Register for an account or log in.
2. Enter your AniList username to import your anime list.
3. Select an anime from the dropdown menu.
4. Start guessing character names!
5. For each correct guess, you'll earn points:
   - Main characters: 3 points
   - Supporting characters: 1 point
6. Try to guess all characters to complete the game.
7. View your score and export your results.

## Project Structure

```
anime-quiz/
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── routes.py
│   └── lib/
│       ├── anilist.py
│       ├── queries.py
│       └── utils.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   ├── package.json
│   └── ...
├── data/
│   ├── characters/
│   ├── users/
│   └── games/
├── requirements.txt
└── README.md
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- AniList for providing the GraphQL API
- All anime fans who enjoy testing their character knowledge 