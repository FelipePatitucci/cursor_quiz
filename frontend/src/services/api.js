import axios from 'axios';

const API_URL = '/api';

// Create axios instance with credentials
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication API
export const register = (username, password, anilistUsername) => {
  return apiClient.post('/register', { username, password, anilist_username: anilistUsername });
};

export const login = (username, password) => {
  return apiClient.post('/login', { username, password });
};

export const logout = () => {
  return apiClient.post('/logout');
};

export const getUserProfile = () => {
  return apiClient.get('/user/profile');
};

export const updateAnilistUsername = (anilistUsername) => {
  return apiClient.post('/user/update_anilist', { anilist_username: anilistUsername });
};

// Anime API
export const getAnimeList = () => {
  return apiClient.get('/animes');
};

// Game API
export const startGame = (animeId, animeTitle) => {
  return apiClient.post('/game/start', { anime_id: animeId, anime_title: animeTitle });
};

export const makeGuess = (guess) => {
  return apiClient.post('/game/guess', { guess });
};

export const endGame = () => {
  return apiClient.post('/game/end');
};

export const getGames = () => {
  return apiClient.get('/games');
};

export const getGame = (gameId) => {
  return apiClient.get(`/game/${gameId}`);
};

export const getGameCharacters = (gameId) => {
  return apiClient.get(`/game/characters/${gameId}`);
};

export const exportGame = (gameId) => {
  return apiClient.get(`/game/export/${gameId}`, { responseType: 'blob' });
};

export const getLeaderboard = () => {
  return apiClient.get('/leaderboard');
};

export default {
  register,
  login,
  logout,
  getUserProfile,
  updateAnilistUsername,
  getAnimeList,
  startGame,
  makeGuess,
  endGame,
  getGames,
  getGame,
  getGameCharacters,
  exportGame,
  getLeaderboard,
}; 