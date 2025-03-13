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
import { exportGame } from '../services/api';

const Game = () => {
  const navigate = useNavigate();
  const { gameState, loading, error, makeGuess, endGame, formatTime, hasActiveGame } = useGame();
  
  const [guess, setGuess] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  
  const inputRef = useRef(null);
  
  // Redirect to dashboard if no active game
  useEffect(() => {
    if (!hasActiveGame) {
      navigate('/');
    }
  }, [hasActiveGame, navigate]);
  
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
      await endGame();
      setShowExportDialog(true);
    } catch (err) {
      console.error('Error ending game:', err);
    }
  };
  
  // Handle exporting game results
  const handleExportGame = async () => {
    try {
      setExportLoading(true);
      setExportError('');
      
      const response = await exportGame(gameState.gameId);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(response.data)]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `game_${gameState.gameId}_results.json`);
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

  // Calculate progress percentage
  const progressPercentage = gameState.totalCharacters 
    ? (gameState.correctGuesses / gameState.totalCharacters) * 100 
    : 0;
  
  // Get recent guesses (last 5)
  const recentGuesses = gameState.guesses.slice(-5).reverse();
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          {gameState.animeTitle}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1">
            Progress: {gameState.correctGuesses} / {gameState.totalCharacters} characters
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimerIcon sx={{ mr: 1 }} />
            <Typography variant="body1">
              {formatTime(gameState.elapsedTime)}
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
                  disabled={loading || gameState.completed}
                  inputRef={inputRef}
                  autoComplete="off"
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !guess.trim() || gameState.completed}
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
                  Score: {gameState.score} points
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
                  Total Guesses: {gameState.totalGuesses}
                </Typography>
                <Typography variant="subtitle1">
                  Accuracy: {gameState.totalGuesses > 0 ? Math.round((gameState.correctGuesses / gameState.totalGuesses) * 100) : 0}%
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {gameState.completed ? (
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
                    startIcon={<DownloadIcon />}
                    onClick={() => setShowExportDialog(true)}
                    fullWidth
                  >
                    Export Results
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
      
      {/* Export dialog */}
      <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)}>
        <DialogTitle>Game Completed</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Congratulations! You've completed the game with a score of {gameState.score} points.
            Would you like to export your game results?
          </DialogContentText>
          
          {exportError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {exportError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/history')}>
            No, Go to History
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
};

export default Game; 