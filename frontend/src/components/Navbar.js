import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Link,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

const Navbar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { hasActiveGame, gameState, endGame } = useGame();
  
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    try {
      // End any active game
      if (hasActiveGame) {
        await endGame();
      }
      
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo - Desktop */}
          <LiveTvIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            ANIME QUIZ
          </Typography>

          {/* Mobile menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="open menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {isAuthenticated && (
                <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/'); }}>
                  <Typography textAlign="center">Dashboard</Typography>
                </MenuItem>
              )}
              
              {hasActiveGame && (
                <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/game'); }}>
                  <Typography textAlign="center">Current Game</Typography>
                </MenuItem>
              )}
              
              {isAuthenticated && (
                <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/history'); }}>
                  <Typography textAlign="center">Game History</Typography>
                </MenuItem>
              )}
              
              <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/leaderboard'); }}>
                <Typography textAlign="center">Leaderboard</Typography>
              </MenuItem>
            </Menu>
          </Box>

          {/* Logo - Mobile */}
          <LiveTvIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            ANIME QUIZ
          </Typography>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {isAuthenticated && (
              <Button
                component={RouterLink}
                to="/"
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                Dashboard
              </Button>
            )}
            
            {hasActiveGame && (
              <Button
                component={RouterLink}
                to="/game"
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                Current Game
              </Button>
            )}
            
            {isAuthenticated && (
              <Button
                component={RouterLink}
                to="/history"
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                Game History
              </Button>
            )}
            
            <Button
              component={RouterLink}
              to="/leaderboard"
              onClick={handleCloseNavMenu}
              sx={{ my: 2, color: 'white', display: 'block' }}
            >
              Leaderboard
            </Button>
          </Box>
          
          {/* Game info */}
          {hasActiveGame && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                {gameState.animeTitle}
              </Typography>
              <Typography variant="body2">
                {gameState.correctGuesses}/{gameState.totalCharacters}
              </Typography>
            </Box>
          )}

          {/* User menu */}
          {isAuthenticated ? (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={user?.username?.toUpperCase() || 'U'} src="/static/images/avatar/2.jpg" />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/profile'); }}>
                  <Typography textAlign="center">Profile</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ flexGrow: 0 }}>
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/login"
                sx={{ mr: 1 }}
              >
                Login
              </Button>
              <Button 
                variant="outlined" 
                color="inherit" 
                component={RouterLink} 
                to="/register"
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 