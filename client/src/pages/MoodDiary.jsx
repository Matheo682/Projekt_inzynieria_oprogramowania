import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Rating,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Fab,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const MoodDiary = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    mood_rating: 5,
    notes: '',
    entry_date: dayjs(),
  });
  const { showSnackbar } = useNotification();

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get('/api/mood');
      // Backend zwraca {entries: []}, więc wyciągamy tablicę
      const entries = response.data.entries || [];
      setEntries(entries);
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      showSnackbar('Błąd podczas pobierania wpisów', 'error');
      setEntries([]); // Fallback do pustej tablicy
    }
  };

  const handleOpen = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        mood_rating: entry.mood_rating,
        notes: entry.notes || '',
        entry_date: dayjs(entry.entry_date),
      });
    } else {
      setEditingEntry(null);
      setFormData({
        mood_rating: 5,
        notes: '',
        entry_date: dayjs(),
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingEntry(null);
    // Wyczyść formularz
    setFormData({
      mood_rating: 5,
      notes: '',
      entry_date: dayjs(),
    });
  };

  const handleSubmit = async () => {
    try {
      const data = {
        moodRating: formData.mood_rating,
        notes: formData.notes,
        entryDate: formData.entry_date.format('YYYY-MM-DD'),
      };

      if (editingEntry) {
        // Edycja istniejącego wpisu
        await axios.put(`/api/mood/${editingEntry.id}`, data);
        showSnackbar('Wpis został zaktualizowany', 'success');
      } else {
        // Dodanie nowego wpisu
        await axios.post('/api/mood', data);
        showSnackbar('Nowy wpis został dodany', 'success');
      }

      fetchEntries();
      handleClose();
    } catch (error) {
      console.error('Error saving mood entry:', error);
      showSnackbar('Błąd podczas zapisywania wpisu', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten wpis?')) {
      try {
        await axios.delete(`/api/mood/${id}`);
        fetchEntries();
        showSnackbar('Wpis został usunięty', 'success');
      } catch (error) {
        console.error('Error deleting mood entry:', error);
        showSnackbar('Błąd podczas usuwania wpisu', 'error');
      }
    }
  };

  const getMoodColor = (rating) => {
    if (rating <= 3) return 'error';
    if (rating <= 6) return 'warning';
    return 'success';
  };

  const getMoodLabel = (rating) => {
    if (rating <= 2) return 'Bardzo słaby';
    if (rating <= 4) return 'Słaby';
    if (rating <= 6) return 'Średni';
    if (rating <= 8) return 'Dobry';
    return 'Bardzo dobry';
  };

  // Sprawdź czy użytkownik ma uprawnienia (tylko pacjenci)
  if (user?.role !== 'patient') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Dostęp ograniczony. Dziennik nastroju jest dostępny tylko dla pacjentów.
        </Alert>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container 
        maxWidth={false} 
        sx={{ 
          px: { xs: 2, sm: 4, md: 6, lg: 8, xl: 12 },
          mx: 'auto',
          maxWidth: '1400px'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Dziennik nastroju
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {entries.map((entry) => (
            <Grid item xs={12} sm={6} md={4} key={entry.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6">
                      {new Date(entry.entry_date).toLocaleDateString()}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpen(entry)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(entry.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Rating value={entry.mood_rating / 2} readOnly precision={0.5} />
                    <Chip
                      label={`${entry.mood_rating}/10`}
                      color={getMoodColor(entry.mood_rating)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" mb={1}>
                    {getMoodLabel(entry.mood_rating)}
                  </Typography>
                  
                  {entry.notes && (
                    <Typography variant="body2">
                      {entry.notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {entries.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
            <Typography variant="h6" color="textSecondary">
              Brak wpisów w dzienniku nastroju
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Dodaj swój pierwszy wpis, aby zacząć śledzić swój nastrój
            </Typography>
          </Paper>
        )}

        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => handleOpen()}
        >
          <Add />
        </Fab>

        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingEntry ? 'Edytuj wpis' : 'Nowy wpis nastroju'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <DatePicker
                label="Data"
                value={formData.entry_date}
                onChange={(newValue) =>
                  setFormData({ ...formData, entry_date: newValue })
                }
                sx={{ width: '100%', mb: 3 }}
              />
              
              <Typography component="legend" gutterBottom>
                Ocena nastroju (1-10)
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Rating
                  value={formData.mood_rating / 2}
                  onChange={(event, newValue) =>
                    setFormData({ ...formData, mood_rating: newValue * 2 })
                  }
                  precision={0.5}
                  size="large"
                />
                <Chip
                  label={`${formData.mood_rating}/10`}
                  color={getMoodColor(formData.mood_rating)}
                />
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notatki (opcjonalne)"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Opisz swój nastrój, wydarzenia dnia, myśli..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Anuluj</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingEntry ? 'Zaktualizuj' : 'Dodaj'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default MoodDiary;
