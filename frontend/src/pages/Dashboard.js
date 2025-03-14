import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  TextField,
  Autocomplete,
  CircularProgress,
  Grid,
  Alert,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { getAnimeList, updateAnilistUsername } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startGame, hasActiveGame, gameState } = useGame();
  
  const [animeList, setAnimeList] = useState([]);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anilistUsername, setAnilistUsername] = useState(user?.anilist_username || '');
  const [isUpdatingAnilist, setIsUpdatingAnilist] = useState(false);
  
  // Fetch anime list when component mounts or anilist username changes
  useEffect(() => {
    const fetchAnimeList = async () => {
      if (!user?.anilist_username) {
        return;
      }
      
      try {
        setLoading(true);
        const response = await getAnimeList();
        setAnimeList(response.data.animes);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load anime list');
        setAnimeList([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnimeList();
  }, [user?.anilist_username]);
  
  // Handle anilist username update
  const handleUpdateAnilist = async () => {
    if (!anilistUsername) {
      setError('Please enter an Anilist username');
      return;
    }
    
    try {
      setIsUpdatingAnilist(true);
      await updateAnilistUsername(anilistUsername);
      window.location.reload(); // Reload to update user info
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update Anilist username');
    } finally {
      setIsUpdatingAnilist(false);
    }
  };
  
  // Handle starting a new game
  const handleStartGame = async () => {
    if (!selectedAnime) {
      setError('Please select an anime first');
      return;
    }
    
    try {
      setLoading(true);
      await startGame(
        selectedAnime.id, 
        selectedAnime.title.english || selectedAnime.title.romaji,
        selectedAnime.cover_image,
        selectedAnime.banner_image,
        selectedAnime.completed_at
      );
      navigate('/game');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect to active game if one exists
  const handleContinueGame = () => {
    navigate('/game');
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" align="center" gutterBottom>
        Welcome to Anime Character Quiz
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Active game card */}
      {hasActiveGame && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" component="div">
              Active Game: {gameState.animeTitle}
            </Typography>
            <Typography variant="body1">
              Progress: {gameState.correctGuesses} / {gameState.totalCharacters} characters
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Score: {gameState.score} points
            </Typography>
          </CardContent>
          <CardActions>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<PlayArrowIcon />}
              onClick={handleContinueGame}
            >
              Continue Game
            </Button>
          </CardActions>
        </Card>
      )}
      
      {/* Completed game results card */}
      {!hasActiveGame && gameState.gameId && gameState.completed && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" component="div">
              Completed Game: {gameState.animeTitle}
            </Typography>
            <Typography variant="body1">
              Found: {gameState.correctGuesses} / {gameState.totalCharacters} characters
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Final Score: {gameState.score} points
            </Typography>
          </CardContent>
          <CardActions>
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleContinueGame}
            >
              View Results
            </Button>
          </CardActions>
        </Card>
      )}
      
      {/* Anilist username form */}
      {!user?.anilist_username && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Set your Anilist Username
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            To play the game, you need to connect your Anilist account so we can fetch your anime list.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <TextField
              fullWidth
              label="Anilist Username"
              value={anilistUsername}
              onChange={(e) => setAnilistUsername(e.target.value)}
              disabled={isUpdatingAnilist}
            />
            <Button
              variant="contained"
              onClick={handleUpdateAnilist}
              disabled={isUpdatingAnilist || !anilistUsername}
            >
              {isUpdatingAnilist ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Anime selection */}
      {user?.anilist_username && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select an Anime to Play
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              fullWidth
              options={animeList}
              loading={loading}
              disabled={loading}
              getOptionLabel={(option) => option.title.english || option.title.romaji}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Anime"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              onChange={(event, newValue) => {
                setSelectedAnime(newValue);
              }}
            />
            
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<PlayArrowIcon />}
              disabled={loading || !selectedAnime}
              onClick={handleStartGame}
            >
              Start Game
            </Button>
          </Box>
          
          {animeList.length === 0 && !loading && user?.anilist_username && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No anime found in your list. Make sure your Anilist profile is public and has anime entries.
            </Alert>
          )}
        </Paper>
      )}
      
      {/* Recent games and stats */}
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              component="a"
              href="/history"
              startIcon={<HistoryIcon />}
              sx={{ height: '100%' }}
            >
              View Game History
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              component="a"
              href="/leaderboard"
              startIcon={<SearchIcon />}
              sx={{ height: '100%' }}
            >
              View Leaderboard
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard; 