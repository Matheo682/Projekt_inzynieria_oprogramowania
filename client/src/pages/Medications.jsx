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
  Grid,
  Card,
  CardContent,
  IconButton,
  Fab,
  Chip,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, Schedule } from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const Medications = () => {
  const { user } = useAuth();
  
  // Sprawdź czy użytkownik ma uprawnienia (tylko pacjenci)
  if (user?.role !== 'patient') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Dostęp ograniczony. Zarządzanie lekami jest dostępne tylko dla pacjentów.
        </Alert>
      </Container>
    );
  }

  const [medications, setMedications] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    time_to_take: [dayjs().hour(8).minute(0)],
    notes: '',
    active: true,
  });
  const { showSnackbar } = useNotification();

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await axios.get('/api/medication');
      // Backend zwraca {medications: []}, więc wyciągamy tablicę
      setMedications(response.data.medications || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      showSnackbar('Błąd podczas pobierania leków', 'error');
      setMedications([]); // Fallback do pustej tablicy
    }
  };

  const handleOpen = (medication = null) => {
    if (medication) {
      setEditingMedication(medication);
      setFormData({
        name: medication.name,
        dosage: medication.dosage || '',
        frequency: medication.frequency || '',
        time_to_take: medication.time_to_take?.map(time => dayjs(time, 'HH:mm')) || [dayjs().hour(8).minute(0)],
        notes: medication.notes || '',
        active: medication.active,
      });
    } else {
      setEditingMedication(null);
      setFormData({
        name: '',
        dosage: '',
        frequency: '',
        time_to_take: [dayjs().hour(8).minute(0)],
        notes: '',
        active: true,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingMedication(null);
  };

  const handleAddTime = () => {
    setFormData({
      ...formData,
      time_to_take: [...formData.time_to_take, dayjs().hour(12).minute(0)],
    });
  };

  const handleRemoveTime = (index) => {
    const newTimes = formData.time_to_take.filter((_, i) => i !== index);
    setFormData({ ...formData, time_to_take: newTimes });
  };

  const handleTimeChange = (index, newTime) => {
    const newTimes = [...formData.time_to_take];
    newTimes[index] = newTime;
    setFormData({ ...formData, time_to_take: newTimes });
  };

  const handleSubmit = async () => {
    try {
      const data = {
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        timeToTake: formData.time_to_take.map(time => time.format('HH:mm')),
        notes: formData.notes,
        active: formData.active,
      };

      if (editingMedication) {
        await axios.put(`/api/medication/${editingMedication.id}`, data);
        showSnackbar('Lek został zaktualizowany', 'success');
      } else {
        await axios.post('/api/medication', data);
        showSnackbar('Nowy lek został dodany', 'success');
      }

      fetchMedications();
      handleClose();
    } catch (error) {
      console.error('Error saving medication:', error);
      showSnackbar('Błąd podczas zapisywania leku', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten lek?')) {
      try {
        await axios.delete(`/api/medication/${id}`);
        fetchMedications();
        showSnackbar('Lek został usunięty', 'success');
      } catch (error) {
        console.error('Error deleting medication:', error);
        showSnackbar('Błąd podczas usuwania leku', 'error');
      }
    }
  };

  const toggleActive = async (id, active) => {
    try {
      await axios.put(`/api/medication/${id}`, { active: !active });
      fetchMedications();
      showSnackbar(`Lek został ${!active ? 'aktywowany' : 'dezaktywowany'}`, 'success');
    } catch (error) {
      console.error('Error updating medication status:', error);
      showSnackbar('Błąd podczas aktualizacji statusu leku', 'error');
    }
  };

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
            Leki
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {medications.map((medication) => (
            <Grid item xs={12} sm={6} md={4} key={medication.id}>
              <Card sx={{ opacity: medication.active ? 1 : 0.6 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6">
                      {medication.name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpen(medication)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(medication.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {medication.dosage && (
                    <Typography variant="body2" color="textSecondary" mb={1}>
                      Dawka: {medication.dosage}
                    </Typography>
                  )}
                  
                  {medication.frequency && (
                    <Typography variant="body2" color="textSecondary" mb={1}>
                      Częstotliwość: {medication.frequency}
                    </Typography>
                  )}
                  
                  {medication.time_to_take && medication.time_to_take.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        Godziny przyjmowania:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {medication.time_to_take.map((time, index) => (
                          <Chip
                            key={index}
                            label={time}
                            icon={<Schedule />}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {medication.notes && (
                    <Typography variant="body2" mb={2}>
                      {medication.notes}
                    </Typography>
                  )}
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      label={medication.active ? 'Aktywny' : 'Nieaktywny'}
                      color={medication.active ? 'success' : 'default'}
                      size="small"
                    />
                    <Button
                      size="small"
                      onClick={() => toggleActive(medication.id, medication.active)}
                    >
                      {medication.active ? 'Dezaktywuj' : 'Aktywuj'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {medications.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
            <Typography variant="h6" color="textSecondary">
              Brak dodanych leków
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Dodaj swój pierwszy lek, aby zacząć zarządzać harmonogramem
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
            {editingMedication ? 'Edytuj lek' : 'Dodaj nowy lek'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Nazwa leku"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Dawka"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                margin="normal"
                placeholder="np. 1 tabletka, 10mg"
              />
              
              <TextField
                fullWidth
                label="Częstotliwość"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                margin="normal"
                placeholder="np. raz dziennie, co 8 godzin"
              />
              
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Godziny przyjmowania
              </Typography>
              
              <List>
                {formData.time_to_take.map((time, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <TimePicker
                        label={`Godzina ${index + 1}`}
                        value={time}
                        onChange={(newTime) => handleTimeChange(index, newTime)}
                        sx={{ flexGrow: 1, mr: 2 }}
                      />
                      <IconButton
                        onClick={() => handleRemoveTime(index)}
                        disabled={formData.time_to_take.length === 1}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </ListItem>
                    {index < formData.time_to_take.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              
              <Button
                variant="outlined"
                onClick={handleAddTime}
                sx={{ mb: 2 }}
              >
                Dodaj godzinę
              </Button>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notatki"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                margin="normal"
                placeholder="Dodatkowe informacje o leku..."
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                }
                label="Aktywny"
                sx={{ mt: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Anuluj</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingMedication ? 'Zaktualizuj' : 'Dodaj'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default Medications;
