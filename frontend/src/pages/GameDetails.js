import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TodayIcon from '@mui/icons-material/Today';
import TimerIcon from '@mui/icons-material/Timer';
import { getGame, exportGame } from '../services/api';

const GameDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const response = await getGame(id);
        setGame(response.data.game);
        setError(null);
      } catch (err) {
        setError('Failed to load game details. Please try again later.');
        console.error('Error fetching game:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGame();
  }, [id]);
  
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const response = await exportGame(id);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(response.data)]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `game_${id}_results.json`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export game results');
      console.error('Error exporting game:', err);
    } finally {
      setExportLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (!game) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Game not found.</Alert>
        <Button
          component={RouterLink}
          to="/history"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to History
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          component={RouterLink}
          to="/history"
          startIcon={<ArrowBackIcon />}
        >
          Back to History
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={exportLoading}
        >
          {exportLoading ? <CircularProgress size={24} /> : 'Export Results'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Game info */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {game.anime_title}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Chip 
                icon={game.completed ? <CheckCircleIcon /> : <CancelIcon />}
                color={game.completed ? "success" : "warning"}
                label={game.completed ? "Completed" : "Abandoned"}
              />
              <Chip 
                icon={<TodayIcon />}
                label={`Played on ${formatDate(game.start_time)}`}
              />
              <Chip 
                icon={<TimerIcon />}
                label={`Duration: ${formatDuration(game.duration)}`}
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Game Statistics
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Score:</strong> {game.score} points
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Characters:</strong> {game.correct_guesses} / {game.total_characters}
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Total Guesses:</strong> {game.total_guesses}
              </Typography>
              
              <Typography variant="body1">
                <strong>Accuracy:</strong> {game.total_guesses > 0 
                  ? Math.round((game.correct_guesses / game.total_guesses) * 100) 
                  : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Guesses list */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Guess History
            </Typography>
            
            {game.guesses && game.guesses.length > 0 ? (
              <List>
                {game.guesses.map((guess, index) => (
                  <React.Fragment key={guess.id || index}>
                    <ListItem>
                      {guess.is_correct ? (
                        <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                      ) : (
                        <CancelIcon color="error" sx={{ mr: 2 }} />
                      )}
                      <ListItemText
                        primary={
                          <Typography 
                            variant="body1" 
                            component="span"
                            sx={{ 
                              fontWeight: guess.is_correct ? 'bold' : 'normal',
                              color: guess.is_correct ? 'success.main' : 'inherit'
                            }}
                          >
                            {guess.guess_text}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {guess.is_correct ? `Correct: ${guess.character_name}` : 'Incorrect'}
                            </Typography>
                            <Typography variant="caption" component="div" color="text.secondary">
                              {formatDate(guess.timestamp)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < game.guesses.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No guesses recorded for this game.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default GameDetails; 