import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  TextField,
  Autocomplete,
  CircularProgress,
  Grid,
  Alert,
  Card,
  CardContent,
  CardActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { getAnimeList, updateAnilistUsername } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startGame, hasActiveGame, gameState } = useGame();
  
  const [animeList, setAnimeList] = useState([]);
  const [filteredAnimeList, setFilteredAnimeList] = useState([]);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anilistUsername, setAnilistUsername] = useState(user?.anilist_username || '');
  const [isUpdatingAnilist, setIsUpdatingAnilist] = useState(false);
  
  // Create an array of year options (from current year down to 2010)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2010 + 1 }, (_, i) => currentYear - i);
  
  // Initialize with empty status options - we'll populate from the API
  const [statusOptions, setStatusOptions] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    status: {},
    minScore: 0,
    maxEpisodes: 1000, // Use a very high number for "no limit"
    yearCompleted: '',
  });
  
  const [activeFilters, setActiveFilters] = useState(0);
  
  // Status labels for better display
  const [statusLabels, setStatusLabels] = useState({});
  
  // Fetch anime list when component mounts or anilist username changes
  useEffect(() => {
    const fetchAnimeList = async () => {
      if (!user?.anilist_username) {
        return;
      }
      
      try {
        setLoading(true);
        const response = await getAnimeList();
        console.log('Sample anime object:', response.data.animes[0]);
        
        // Get all unique status values
        const animes = response.data.animes;
        
        // Log duplicate anime IDs to help debug duplicate key issues
        const idCounts = {};
        const duplicateAnimes = [];
        
        animes.filter(Boolean).forEach(anime => {
          if (!anime.id) {
            console.log('Found anime without ID:', anime);
            return;
          }
          
          idCounts[anime.id] = (idCounts[anime.id] || 0) + 1;
          
          if (idCounts[anime.id] === 2) {
            // First time we've found this is a duplicate
            duplicateAnimes.push(anime);
          }
        });
        
        // Log duplicate IDs if any found
        const duplicateIds = Object.entries(idCounts)
          .filter(([id, count]) => count > 1)
          .map(([id, count]) => ({ id, count }));
          
        if (duplicateIds.length > 0) {
          console.log('Found duplicate anime IDs:', duplicateIds);
          console.log('Sample duplicate animes:', duplicateAnimes);
        } else {
          console.log('No duplicate anime IDs found');
        }
        
        // Ensure all anime entries have unique IDs by using a Map
        // This will eliminate any duplicates by ID
        const uniqueAnimes = Array.from(
          new Map(animes.filter(Boolean).map(anime => [anime.id, anime])).values()
        );
        
        console.log(`Received ${animes.length} animes, after deduplication: ${uniqueAnimes.length}`);
        
        if (uniqueAnimes.length > 0) {
          const uniqueStatuses = [...new Set(uniqueAnimes.map(anime => anime.status))].filter(Boolean);
          console.log('Unique status values:', uniqueStatuses);
          
          // Create new status options and labels based on the API data
          const newStatusOptions = {};
          const newStatusFilters = {};
          const newStatusLabels = {};
          
          uniqueStatuses.forEach(status => {
            if (status) {
              // Default, enable 'completed' and 'current' statuses
              const isDefault = status === 'completed' || status === 'current';
              newStatusOptions[status] = true;
              newStatusFilters[status] = isDefault;
              
              // Create a nice label with first letter capitalized
              const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
              newStatusLabels[status] = label;
            }
          });
          
          // Update our state
          setStatusOptions(newStatusOptions);
          setStatusLabels(prev => newStatusLabels);
          setFilters(prev => ({
            ...prev,
            status: newStatusFilters
          }));
        }
        
        setAnimeList(uniqueAnimes);
        setFilteredAnimeList(uniqueAnimes);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load anime list');
        setAnimeList([]);
        setFilteredAnimeList([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnimeList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.anilist_username]);
  
  // Get a list of all possible statuses to ensure we have a complete set
  useEffect(() => {
    if (animeList && animeList.length > 0) {
      // Log unique status values from the anime list
      const uniqueStatuses = [...new Set(animeList.map(anime => anime.status))];
      console.log('Unique status values in anime list:', uniqueStatuses);
    }
  }, [animeList]);
  
  // Apply filters when filters or anime list changes
  useEffect(() => {
    if (!animeList.length) return;
    
    console.log('Filtering', animeList.length, 'animes with filters:', filters);
    
    // Debug - log some sample animes to see their structure
    if (animeList.length > 0) {
      console.log('First anime:', animeList[0]);
    }
    
    const filtered = animeList.filter(anime => {
      // Make sure we have a valid anime object
      if (!anime || !anime.title) {
        return false;
      }
      
      // Status filter - make sure the anime has a status and it's enabled in filters
      const animeStatus = anime.status;
      
      // Debug the status check
      if (!animeStatus) {
        console.log('Anime missing status:', anime.title);
        return false;
      } 
      
      // Check if the status is enabled in our filters
      if (!filters.status[animeStatus]) {
        return false;
      }
      
      // Score filter - handle potential undefined scores
      if (filters.minScore > 0) {
        // Skip the score filter if anime doesn't have a score
        if (anime.score === undefined || anime.score === null) {
          return false;
        }
        // Check if the score is below the minimum
        if (anime.score < filters.minScore) {
          return false;
        }
      }
      
      // Episode count filter - only apply if anime has episodes and maxEpisodes is not at "no limit"
      if (anime.episodes && filters.maxEpisodes < anime.episodes) {
        return false;
      }
      
      // Year filter
      if (filters.yearCompleted && anime.completed_at && anime.completed_at.year) {
        if (anime.completed_at.year < filters.yearCompleted) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log('Filtered animes:', filtered.length);
    setFilteredAnimeList(filtered);
    
    // Count active filters
    let activeCount = 0;
    
    // Status filters - now using lowercase values consistent with our API data
    const defaultStatus = {};
    
    // Set default status values (completed and current are true, others are false)
    Object.keys(filters.status).forEach(status => {
      defaultStatus[status] = status === 'completed' || status === 'current';
    });
    
    const statusChanged = Object.keys(filters.status).some(
      status => filters.status[status] !== defaultStatus[status]
    );
    
    if (statusChanged) activeCount++;
    
    // Other filters
    if (filters.minScore > 0) activeCount++;
    if (filters.maxEpisodes < 1000) activeCount++;
    if (filters.yearCompleted) activeCount++;
    
    setActiveFilters(activeCount);
    
  }, [filters, animeList]);
  
  // Handle anilist username update
  const handleUpdateAnilist = async () => {
    if (!anilistUsername) {
      setError('Please enter an Anilist username');
      return;
    }
    
    try {
      setIsUpdatingAnilist(true);
      await updateAnilistUsername(anilistUsername);
      window.location.reload(); // Reload to update user info
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update Anilist username');
    } finally {
      setIsUpdatingAnilist(false);
    }
  };
  
  // Handle filter changes
  const handleStatusChange = (status) => {
    setFilters(prev => ({
      ...prev,
      status: {
        ...prev.status,
        [status]: !prev.status[status]
      }
    }));
  };
  
  const handleScoreChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      minScore: newValue
    }));
  };
  
  const handleEpisodeChange = (event, newValue) => {
    // If the slider is at max (100), set to 1000 to represent "No limit"
    const maxEpisodes = newValue === 100 ? 1000 : newValue;
    setFilters(prev => ({
      ...prev,
      maxEpisodes
    }));
  };
  
  const handleYearChange = (event) => {
    setFilters(prev => ({
      ...prev,
      yearCompleted: event.target.value
    }));
  };
  
  const clearFilters = () => {
    // Reset status to default values (current and completed enabled, others disabled)
    const resetStatus = {};
    Object.keys(statusOptions).forEach(status => {
      resetStatus[status] = status === 'current' || status === 'completed';
    });
    
    setFilters({
      status: resetStatus,
      minScore: 0,
      maxEpisodes: 1000, // Use a very high number for "no limit"
      yearCompleted: '',
    });
  };
  
  // Handle starting a new game
  const handleStartGame = async () => {
    if (!selectedAnime) {
      setError('Please select an anime first');
      return;
    }
    
    try {
      setLoading(true);
      await startGame(
        selectedAnime.id, 
        selectedAnime.title.english || selectedAnime.title.romaji,
        selectedAnime.cover_image,
        selectedAnime.banner_image,
        selectedAnime.completed_at
      );
      navigate('/game');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect to active game if one exists
  const handleContinueGame = () => {
    navigate('/game');
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" align="center" gutterBottom>
        Welcome to Anime Character Quiz
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Active game card */}
      {hasActiveGame && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" component="div">
              Active Game: {gameState.animeTitle}
            </Typography>
            <Typography variant="body1">
              Progress: {gameState.correctGuesses} / {gameState.totalCharacters} characters
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Score: {gameState.score} points
            </Typography>
          </CardContent>
          <CardActions>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<PlayArrowIcon />}
              onClick={handleContinueGame}
            >
              Continue Game
            </Button>
          </CardActions>
        </Card>
      )}
      
      {/* Completed game results card */}
      {!hasActiveGame && gameState.gameId && gameState.completed && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" component="div">
              Completed Game: {gameState.animeTitle}
            </Typography>
            <Typography variant="body1">
              Found: {gameState.correctGuesses} / {gameState.totalCharacters} characters
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Final Score: {gameState.score} points
            </Typography>
          </CardContent>
          <CardActions>
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleContinueGame}
            >
              View Results
            </Button>
          </CardActions>
        </Card>
      )}
      
      {/* Anilist username form */}
      {!user?.anilist_username && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Set your Anilist Username
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            To play the game, you need to connect your Anilist account so we can fetch your anime list.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <TextField
              fullWidth
              label="Anilist Username"
              value={anilistUsername}
              onChange={(e) => setAnilistUsername(e.target.value)}
              disabled={isUpdatingAnilist}
            />
            <Button
              variant="contained"
              onClick={handleUpdateAnilist}
              disabled={isUpdatingAnilist || !anilistUsername}
            >
              {isUpdatingAnilist ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Anime selection */}
      {user?.anilist_username && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select an Anime to Play
          </Typography>
          
          {/* Filters */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="anime-filters"
              id="anime-filters-header"
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <FilterListIcon sx={{ mr: 1 }} />
                <Typography>Filters</Typography>
                {activeFilters > 0 && (
                  <Chip 
                    size="small" 
                    label={activeFilters} 
                    color="primary" 
                    sx={{ ml: 1 }}
                  />
                )}
                <Box sx={{ flexGrow: 1 }} />
                {activeFilters > 0 && (
                  <Button 
                    size="small" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      clearFilters(); 
                    }}
                    startIcon={<ClearIcon />}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Status Filter */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Status
                  </Typography>
                  <FormGroup>
                    {Object.keys(statusOptions).map(status => (
                      <FormControlLabel
                        key={`status-checkbox-${status}`}
                        control={
                          <Checkbox
                            checked={filters.status[status]}
                            onChange={() => handleStatusChange(status)}
                          />
                        }
                        label={statusLabels[status] || status}
                      />
                    ))}
                  </FormGroup>
                </Grid>
                
                {/* Score Filter */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Minimum Score: {filters.minScore}
                  </Typography>
                  <Slider
                    value={filters.minScore}
                    onChange={handleScoreChange}
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={0}
                    max={10}
                  />
                </Grid>
                
                {/* Episode Count Filter */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Maximum Episodes: {filters.maxEpisodes < 1000 ? filters.maxEpisodes : 'No limit'}
                  </Typography>
                  <Slider
                    value={Math.min(filters.maxEpisodes, 100)}
                    onChange={handleEpisodeChange}
                    valueLabelDisplay="auto"
                    step={5}
                    marks={[
                      { value: 10, label: '10' },
                      { value: 25, label: '25' },
                      { value: 50, label: '50' },
                      { value: 100, label: 'No limit' }
                    ]}
                    min={10}
                    max={100}
                  />
                </Grid>
                
                {/* Year Filter - Simplified replacement for DatePicker */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="year-label">Completed After Year</InputLabel>
                    <Select
                      labelId="year-label"
                      value={filters.yearCompleted}
                      onChange={handleYearChange}
                      label="Completed After Year"
                      displayEmpty
                    >
                      <MenuItem value="">Any year</MenuItem>
                      {yearOptions.map((year) => (
                        <MenuItem key={year} value={year}>{year}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredAnimeList.length} animes shown out of {animeList.length} total
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              fullWidth
              options={filteredAnimeList}
              loading={loading}
              disabled={loading}
              getOptionLabel={(option) => option.title?.english || option.title?.romaji || 'Unknown Anime'}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderOption={(props, option) => {
                // Skip rendering if we don't have a valid ID
                if (!option || !option.id) return null;
                
                // Ensure each option has a truly unique key with a prefix
                const uniqueKey = `anime-option-${option.id}`;
                
                return (
                  <li {...props} key={uniqueKey}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ 
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <Typography variant="body1">
                          {option.title?.english || option.title?.romaji || 'Unknown Title'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {option.score > 0 && (
                            <Chip 
                              size="small" 
                              label={`Score: ${option.score}`} 
                              color={option.score >= 8 ? "success" : "default"}
                            />
                          )}
                          <Chip 
                            size="small" 
                            label={statusLabels[option.status] || option.status || 'Unknown Status'}
                            color="primary" 
                            variant="outlined"
                          />
                          {option.episodes && (
                            <Typography variant="caption">
                              {option.episodes} episodes
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </li>
                );
              }}
              filterOptions={(options, state) => {
                // This prevents Material-UI's default fuzzy search from creating duplicate entries
                return options.filter(option => {
                  const label = option.title?.english || option.title?.romaji || '';
                  return label.toLowerCase().includes(state.inputValue.toLowerCase());
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Anime"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              onChange={(event, newValue) => {
                setSelectedAnime(newValue);
              }}
            />
            
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<PlayArrowIcon />}
              disabled={loading || !selectedAnime}
              onClick={handleStartGame}
            >
              Start Game
            </Button>
          </Box>
          
          {filteredAnimeList.length === 0 && !loading && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No anime found with the current filters. Try adjusting your filters or add more anime to your list.
            </Alert>
          )}
          
          {animeList.length === 0 && !loading && user?.anilist_username && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No anime found in your list. Make sure your Anilist profile is public and has anime entries.
            </Alert>
          )}
        </Paper>
      )}
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => navigate('/history')}
        >
          View Game History
        </Button>
      </Box>
    </Container>
  );
};

export default Dashboard; 