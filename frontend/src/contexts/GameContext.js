import React, { createContext, useState, useContext } from 'react';
import { startGame, makeGuess, endGame } from '../services/api';

// Create context
const GameContext = createContext(null);

// Game provider component
export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState({
    gameId: null,
    animeTitle: '',
    totalCharacters: 0,
    correctGuesses: 0,
    totalGuesses: 0,
    score: 0,
    completed: false,
    guesses: [],
    startTime: null,
    timerInterval: null,
    elapsedTime: 0,
    coverImage: null,
    bannerImage: null,
    completedAt: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Start a new game
  const handleStartGame = async (animeId, animeTitle, coverImage, bannerImage, completedAt) => {
    try {
      setLoading(true);
      
      // Reset game state completely instead of trying to end a completed game
      if (gameState.gameId) {
        // If the game is still active, end it properly
        if (!gameState.completed) {
          await endGame();
        } else {
          // If the game is already completed, just reset the state
          resetGame();
        }
      }
      
      const response = await startGame(animeId, animeTitle);
      
      // Start timer
      const startTime = Date.now();
      const timerInterval = setInterval(() => {
        setGameState(prevState => ({
          ...prevState,
          elapsedTime: Math.floor((Date.now() - startTime) / 1000)
        }));
      }, 1000);
      
      setGameState({
        gameId: response.data.game_id,
        animeTitle: response.data.anime_title,
        totalCharacters: response.data.total_characters,
        correctGuesses: 0,
        totalGuesses: 0,
        score: 0,
        completed: false,
        guesses: [],
        startTime,
        timerInterval,
        elapsedTime: 0,
        coverImage,
        bannerImage,
        completedAt,
      });
      
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start game');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Make a guess
  const handleMakeGuess = async (guessText) => {
    try {
      setLoading(true);
      
      if (!gameState.gameId) {
        throw new Error('No active game');
      }
      
      const response = await makeGuess(guessText);
      
      // Update game state with the response
      setGameState(prevState => {
        const newGuesses = [
          ...prevState.guesses,
          {
            text: guessText,
            isCorrect: response.data.is_correct,
            characterName: response.data.character_name,
            timestamp: new Date().toISOString(),
          }
        ];
        
        // If game is completed, clear the timer
        if (response.data.completed && prevState.timerInterval) {
          clearInterval(prevState.timerInterval);
        }
        
        return {
          ...prevState,
          correctGuesses: response.data.correct_guesses,
          totalGuesses: response.data.total_guesses,
          score: response.data.score,
          completed: response.data.completed,
          guesses: newGuesses,
          timerInterval: response.data.completed ? null : prevState.timerInterval,
        };
      });
      
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process guess');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // End the current game
  const handleEndGame = async () => {
    try {
      setLoading(true);
      
      if (!gameState.gameId) {
        throw new Error('No active game');
      }
      
      // Clear the timer
      if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
      }
      
      const response = await endGame();
      
      // Update game state but don't fully reset it to preserve game data for results
      setGameState(prevState => ({
        ...prevState,
        completed: true,
        timerInterval: null,
      }));
      
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end game');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset game state (without API call)
  const resetGame = () => {
    // Clear the timer if it exists
    if (gameState.timerInterval) {
      clearInterval(gameState.timerInterval);
    }
    
    setGameState({
      gameId: null,
      animeTitle: '',
      totalCharacters: 0,
      correctGuesses: 0,
      totalGuesses: 0,
      score: 0,
      completed: false,
      guesses: [],
      startTime: null,
      timerInterval: null,
      elapsedTime: 0,
      coverImage: null,
      bannerImage: null,
      completedAt: null,
    });
    
    setError(null);
  };

  // Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Context value
  const value = {
    gameState,
    loading,
    error,
    startGame: handleStartGame,
    makeGuess: handleMakeGuess,
    endGame: handleEndGame,
    resetGame,
    formatTime,
    hasActiveGame: !!gameState.gameId && !gameState.completed,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// Custom hook to use the game context
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export default GameContext; 