import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

/**
 * GameResults component displays all characters from a completed game, 
 * showing which ones were correctly guessed and which were missed.
 * 
 * @param {Object} props
 * @param {Array} props.allCharacters - Array of all characters in the game
 * @param {Array} props.correctlyGuessed - Array of character IDs that were correctly guessed
 * @param {String} props.animeTitle - Title of the anime
 * @param {Number} props.score - Final score
 * @param {Number} props.totalGuesses - Total number of guesses made
 */
const GameResults = ({ allCharacters, correctlyGuessed, animeTitle, score, totalGuesses }) => {
  // Split characters into correctly guessed and missed
  const guessedChars = allCharacters.filter(char => correctlyGuessed.includes(char.id));
  const missedChars = allCharacters.filter(char => !correctlyGuessed.includes(char.id));
  
  const accuracy = totalGuesses > 0 
    ? Math.round((correctlyGuessed.length / totalGuesses) * 100) 
    : 0;
  
  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Game Results: {animeTitle}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', mb: 3 }}>
          <Box sx={{ textAlign: 'center', p: 1 }}>
            <Typography variant="h6">Final Score</Typography>
            <Typography variant="h4" color="primary">{score}</Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', p: 1 }}>
            <Typography variant="h6">Accuracy</Typography>
            <Typography variant="h4" color="primary">{accuracy}%</Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', p: 1 }}>
            <Typography variant="h6">Characters Found</Typography>
            <Typography variant="h4" color="primary">{correctlyGuessed.length}/{allCharacters.length}</Typography>
          </Box>
        </Box>
      </Paper>
      
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Characters You Found ({guessedChars.length})
      </Typography>
      
      {guessedChars.length > 0 ? (
        <Grid container spacing={2}>
          {guessedChars.map(character => (
            <Grid item xs={12} sm={6} md={4} key={character.id}>
              <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                <Avatar
                  src={character.image}
                  alt={character.name}
                  sx={{ width: 100, height: 100, mb: 2, border: '2px solid #4caf50' }}
                />
                <Typography variant="subtitle1" fontWeight="bold" textAlign="center">
                  {character.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {character.role === 'MAIN' ? 'Main Character' : 'Supporting Character'}
                </Typography>
                <Chip 
                  icon={<CheckCircleIcon />} 
                  label="Correctly Guessed" 
                  color="success" 
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" sx={{ mb: 3 }}>
          You didn't find any characters.
        </Typography>
      )}
      
      <Divider sx={{ my: 4 }} />
      
      <Typography variant="h5" gutterBottom>
        Characters You Missed ({missedChars.length})
      </Typography>
      
      {missedChars.length > 0 ? (
        <Grid container spacing={2}>
          {missedChars.map(character => (
            <Grid item xs={12} sm={6} md={4} key={character.id}>
              <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                <Avatar
                  src={character.image}
                  alt={character.name}
                  sx={{ width: 100, height: 100, mb: 2, border: '2px solid #f44336' }}
                />
                <Typography variant="subtitle1" fontWeight="bold" textAlign="center">
                  {character.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  {character.role === 'MAIN' ? 'Main Character' : 'Supporting Character'}
                </Typography>
                <Chip 
                  icon={<CancelIcon />} 
                  label="Missed" 
                  color="error" 
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1">
          Congratulations! You found all characters.
        </Typography>
      )}
    </Box>
  );
};

export default GameResults; 