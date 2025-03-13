import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Box,
  Chip,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getLeaderboard } from '../services/api';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await getLeaderboard();
        setLeaderboard(response.data.leaderboard);
        setError(null);
      } catch (err) {
        setError('Failed to load leaderboard. Please try again later.');
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <EmojiEventsIcon sx={{ fontSize: 35, verticalAlign: 'middle', mr: 1 }} />
          Leaderboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Top scores from all players
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {leaderboard.length === 0 ? (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No games have been completed yet.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Be the first one to get on the leaderboard!
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Player</TableCell>
                <TableCell>Anime</TableCell>
                <TableCell align="center">Score</TableCell>
                <TableCell align="center">Progress</TableCell>
                <TableCell align="center">Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((entry, index) => (
                <TableRow 
                  key={index} 
                  hover
                  sx={{
                    backgroundColor: index === 0 ? 'rgba(255, 215, 0, 0.05)' : 'inherit',
                    '&:nth-of-type(2)': {
                      backgroundColor: 'rgba(192, 192, 192, 0.05)'
                    },
                    '&:nth-of-type(3)': {
                      backgroundColor: 'rgba(205, 127, 50, 0.05)'
                    }
                  }}
                >
                  <TableCell>
                    {index === 0 ? (
                      <Chip 
                        label="1st" 
                        color="primary" 
                        size="small" 
                        icon={<EmojiEventsIcon />}
                      />
                    ) : index === 1 ? (
                      <Chip 
                        label="2nd" 
                        size="small" 
                        sx={{ backgroundColor: 'rgba(192, 192, 192, 0.7)', color: 'white' }}
                      />
                    ) : index === 2 ? (
                      <Chip 
                        label="3rd" 
                        size="small"
                        sx={{ backgroundColor: 'rgba(205, 127, 50, 0.7)', color: 'white' }}
                      />
                    ) : (
                      `${index + 1}th`
                    )}
                  </TableCell>
                  <TableCell>{entry.username}</TableCell>
                  <TableCell>{entry.anime_title}</TableCell>
                  <TableCell align="center">{entry.score}</TableCell>
                  <TableCell align="center">
                    {entry.correct_guesses}/{entry.total_characters}
                  </TableCell>
                  <TableCell align="center">{entry.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default Leaderboard; 