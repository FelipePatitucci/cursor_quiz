import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="sm">
        <Typography variant="body1" align="center">
          Anime Character Quiz App
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {'Copyright © '}
          <Link color="inherit" href="#">
            Anime Quiz
          </Link>{' '}
          {new Date().getFullYear()}
          {'. Powered by '}
          <Link color="inherit" href="https://anilist.co" target="_blank" rel="noopener">
            Anilist API
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 