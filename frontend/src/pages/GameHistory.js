import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getGames, exportGame } from '../services/api';

const GameHistory = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await getGames();
        setGames(response.data.games);
        setError(null);
      } catch (err) {
        setError('Failed to load game history. Please try again later.');
        console.error('Error fetching games:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGames();
  }, []);
  
  const handleExport = async (gameId) => {
    try {
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
    } catch (err) {
      setError('Failed to export game results');
      console.error('Error exporting game:', err);
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
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Game History
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {games.length === 0 ? (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            You haven't played any games yet.
          </Typography>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Start Playing
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Anime</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Score</TableCell>
                <TableCell align="center">Progress</TableCell>
                <TableCell align="center">Date</TableCell>
                <TableCell align="center">Duration</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.id} hover>
                  <TableCell component="th" scope="row">
                    {game.anime_title}
                  </TableCell>
                  <TableCell align="center">
                    {game.completed ? (
                      <Chip 
                        size="small"
                        color="success" 
                        icon={<CheckCircleIcon />} 
                        label="Completed" 
                      />
                    ) : (
                      <Chip 
                        size="small"
                        color="warning" 
                        icon={<CancelIcon />} 
                        label="Abandoned" 
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">{game.score}</TableCell>
                  <TableCell align="center">
                    {game.correct_guesses}/{game.total_characters}
                  </TableCell>
                  <TableCell align="center">{formatDate(game.start_time)}</TableCell>
                  <TableCell align="center">{formatDuration(game.duration)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        component={RouterLink}
                        to={`/game/${game.id}`}
                        startIcon={<VisibilityIcon />}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleExport(game.id)}
                        startIcon={<DownloadIcon />}
                      >
                        Export
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default GameHistory; 