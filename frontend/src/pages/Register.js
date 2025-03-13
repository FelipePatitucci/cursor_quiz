import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  TextField,
  Link,
  Grid,
  Box,
  Typography,
  Container,
  Paper,
  Alert,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register, error, loading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [anilistUsername, setAnilistUsername] = useState('');
  const [formError, setFormError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!username || !password || !confirmPassword) {
      setFormError('Please fill in all required fields.');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    
    try {
      setFormError('');
      await register(username, password, anilistUsername);
      navigate('/');
    } catch (err) {
      setFormError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };
  
  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        
        {(formError || error) && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {formError || error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            name="anilistUsername"
            label="Anilist Username (Optional)"
            id="anilistUsername"
            autoComplete="off"
            value={anilistUsername}
            onChange={(e) => setAnilistUsername(e.target.value)}
            helperText="You can also set this later in your profile"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
          <Grid container>
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                {"Already have an account? Sign In"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 