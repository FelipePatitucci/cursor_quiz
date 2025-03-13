import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  LinearProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerIcon from '@mui/icons-material/Timer';
import DownloadIcon from '@mui/icons-material/Download';
import { useGame } from '../contexts/GameContext';
import { exportGame, getGameCharacters } from '../services/api';
import GameResults from '../components/GameResults';

const Game = () => {
  const navigate = useNavigate();
  const { gameState, loading, error, makeGuess, endGame, formatTime, hasActiveGame } = useGame();
  
  const [guess, setGuess] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [gameCharacters, setGameCharacters] = useState([]);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [localGameState, setLocalGameState] = useState(null);
  
  const inputRef = useRef(null);
  
  // Redirect to dashboard if no active game AND we're not showing results
  useEffect(() => {
    if (!hasActiveGame && !gameEnded && !showResults) {
      navigate('/');
    }
  }, [hasActiveGame, navigate, gameEnded, showResults]);
  
  // Store gameState locally when game ends
  useEffect(() => {
    if (gameState && gameState.completed && !gameEnded) {
      setLocalGameState({...gameState});
      setGameEnded(true);
    }
  }, [gameState, gameEnded]);
  
  // Focus input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Refocus input field after loading state changes
  useEffect(() => {
    if (!loading && inputRef.current && !gameState.completed) {
      inputRef.current.focus();
    }
  }, [loading, gameState.completed]);

  // Load characters data when game is completed
  useEffect(() => {
    const fetchCharacters = async () => {
      const gameDataToUse = gameEnded ? localGameState : gameState;
      
      if (gameDataToUse && gameDataToUse.completed && gameDataToUse.gameId && !showResults) {
        try {
          setCharactersLoading(true);
          const response = await getGameCharacters(gameDataToUse.gameId);
          setGameCharacters(response.data.characters);
          setShowResults(true);
        } catch (error) {
          console.error('Error fetching game characters:', error);
        } finally {
          setCharactersLoading(false);
        }
      }
    };

    fetchCharacters();
  }, [gameState.completed, gameState.gameId, showResults, gameEnded, localGameState]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!guess.trim()) {
      return;
    }
    
    try {
      await makeGuess(guess.trim());
      setGuess('');
      
      // Focus back on input field
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    } catch (err) {
      console.error('Error making guess:', err);
    }
  };
  
  // Handle ending the game
  const handleEndGame = async () => {
    try {
      // Save current state before ending
      setLocalGameState({...gameState, completed: true});
      setGameEnded(true);
      
      // End the game in the backend
      await endGame();
      
      // Fetch characters for results
      const response = await getGameCharacters(gameState.gameId);
      setGameCharacters(response.data.characters);
      setShowResults(true);
    } catch (err) {
      console.error('Error ending game:', err);
    }
  };
  
  // Handle exporting game results
  const handleExportGame = async () => {
    try {
      setExportLoading(true);
      setExportError('');
      
      const gameId = gameEnded ? localGameState.gameId : gameState.gameId;
      const response = await exportGame(gameId);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(response.data)]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `game_${gameId}_results.json`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowExportDialog(false);
      navigate('/history');
    } catch (err) {
      setExportError('Failed to export game results');
      console.error('Error exporting game:', err);
    } finally {
      setExportLoading(false);
    }
  };
  
  // Handle keypress events
  const handleKeyDown = (e) => {
    // If not in an input field and a letter/number is pressed, focus the input field
    if (!e.target.tagName.match(/input|textarea/i) && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  // Add global key event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Use the appropriate game state
  const activeGameState = gameEnded ? localGameState : gameState;

  // Calculate progress percentage
  const progressPercentage = activeGameState.totalCharacters 
    ? (activeGameState.correctGuesses / activeGameState.totalCharacters) * 100 
    : 0;
  
  // Get recent guesses (last 5)
  const recentGuesses = activeGameState.guesses.slice(-5).reverse();

  // If showing results, transform characters data for the GameResults component
  const prepareCharactersForResults = () => {
    const correctlyGuessedIds = gameCharacters
      .filter(char => char.was_guessed)
      .map(char => char.id);
    
    return {
      allCharacters: gameCharacters.map(char => ({
        id: char.id,
        name: char.name,
        image: char.image,
        role: char.role
      })),
      correctlyGuessed: correctlyGuessedIds,
      animeTitle: activeGameState.animeTitle,
      score: activeGameState.score,
      totalGuesses: activeGameState.totalGuesses
    };
  };
  
  // If showing results, render GameResults component
  if (showResults && gameCharacters.length > 0) {
    return (
      <Container maxWidth="lg">
        <GameResults {...prepareCharactersForResults()} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/history')}
          >
            View Game History
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setShowExportDialog(true)}
          >
            Export Results
          </Button>
        </Box>
        
        {/* Export dialog */}
        <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)}>
          <DialogTitle>Export Game Results</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Would you like to export your game results as a JSON file?
            </DialogContentText>
            
            {exportError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {exportError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExportGame}
              disabled={exportLoading}
              variant="contained"
              startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
            >
              {exportLoading ? 'Exporting...' : 'Export Results'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  // Loading state while fetching characters
  if (charactersLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading game results...
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          {activeGameState.animeTitle}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1">
            Progress: {activeGameState.correctGuesses} / {activeGameState.totalCharacters} characters
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimerIcon sx={{ mr: 1 }} />
            <Typography variant="body1">
              {formatTime(activeGameState.elapsedTime)}
            </Typography>
          </Box>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          color="success"
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Main game area */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Guess Character Names
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Enter character name"
                  variant="outlined"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  disabled={loading || activeGameState.completed}
                  inputRef={inputRef}
                  autoComplete="off"
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !guess.trim() || activeGameState.completed}
                  sx={{ ml: 1 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Guess'}
                </Button>
              </Box>
            </form>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Recent Guesses
            </Typography>
            
            {recentGuesses.length > 0 ? (
              <List>
                {recentGuesses.map((guess, index) => (
                  <ListItem key={index} sx={{ py: 1 }}>
                    {guess.isCorrect ? (
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    ) : (
                      <CancelIcon color="error" sx={{ mr: 1 }} />
                    )}
                    <ListItemText 
                      primary={
                        <Typography 
                          variant="body1" 
                          component="span"
                          sx={{ 
                            fontWeight: guess.isCorrect ? 'bold' : 'normal',
                            color: guess.isCorrect ? 'success.main' : 'inherit'
                          }}
                        >
                          {guess.text}
                        </Typography>
                      }
                      secondary={guess.isCorrect ? `Correct: ${guess.characterName}` : 'Incorrect'}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No guesses made yet. Start typing character names!
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Stats panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Game Stats
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  Score: {activeGameState.score} points
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Main characters: 3 points each
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supporting characters: 1 point each
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  Total Guesses: {activeGameState.totalGuesses}
                </Typography>
                <Typography variant="subtitle1">
                  Accuracy: {activeGameState.totalGuesses > 0 ? Math.round((activeGameState.correctGuesses / activeGameState.totalGuesses) * 100) : 0}%
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {activeGameState.completed ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip 
                    label="Game Completed!" 
                    color="success" 
                    icon={<CheckCircleIcon />} 
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setShowResults(true)}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    View Results
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleEndGame}
                  fullWidth
                >
                  End Game
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Game; 