import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { updateAnilistUsername } from '../services/api';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  
  const [anilistUsername, setAnilistUsername] = useState(user?.anilist_username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const handleUpdateAnilist = async (e) => {
    e.preventDefault();
    
    if (!anilistUsername.trim()) {
      setError('Please enter an Anilist username');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await updateAnilistUsername(anilistUsername);
      setSuccess('Anilist username updated successfully. Reload the page to see changes.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update Anilist username');
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Account Information
              </Typography>
              <Typography variant="body1">
                <strong>Username:</strong> {user?.username}
              </Typography>
              <Typography variant="body1">
                <strong>Anilist Username:</strong> {user?.anilist_username || 'Not set'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Update Anilist Username
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            <form onSubmit={handleUpdateAnilist}>
              <TextField
                fullWidth
                label="Anilist Username"
                variant="outlined"
                value={anilistUsername}
                onChange={(e) => setAnilistUsername(e.target.value)}
                disabled={loading}
                margin="normal"
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Update'}
              </Button>
            </form>
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Note: Your Anilist profile must be public for the app to access your anime list.
        </Typography>
      </Box>
    </Container>
  );
};

export default Profile; 