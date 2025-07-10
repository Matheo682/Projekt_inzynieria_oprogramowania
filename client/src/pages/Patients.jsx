import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Person, ExpandMore, Mood, LocalPharmacy } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { user } = useAuth();
  const { showSnackbar } = useNotification();

  useEffect(() => {
    if (user.role === 'therapist') {
      fetchPatients();
    }
  }, [user.role]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/auth/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      showSnackbar('Błąd podczas pobierania listy pacjentów', 'error');
    }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const results = await Promise.allSettled([
        axios.get(`/api/mood/patient/${patientId}`),
        axios.get(`/api/medication/patient/${patientId}`),
        axios.get(`/api/messages/patient/${patientId}`)
      ]);

      const moodData = results[0].status === 'fulfilled' ? results[0].value.data.entries || [] : [];
      const medicationsData = results[1].status === 'fulfilled' ? results[1].value.data.medications || [] : [];
      const messagesData = results[2].status === 'fulfilled' ? results[2].value.data.messages || [] : [];

      setPatientDetails({
        moodEntries: moodData,
        medications: medicationsData,
        lastMessage: messagesData[0] || null,
      });

      // Sprawdź czy były błędy 403 (brak relacji)
      const hasAccessErrors = results.some(result => 
        result.status === 'rejected' && result.reason?.response?.status === 403
      );
      
      if (hasAccessErrors) {
        showSnackbar('Brak relacji terapeuta-pacjent. Niektóre dane mogą być niedostępne.', 'warning');
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      showSnackbar('Błąd podczas pobierania szczegółów pacjenta', 'error');
      // Ustaw puste dane jako fallback
      setPatientDetails({
        moodEntries: [],
        medications: [],
        lastMessage: null,
      });
    }
  };

  const handleViewPatient = async (patient) => {
    setSelectedPatient(patient);
    await fetchPatientDetails(patient.id);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedPatient(null);
    setPatientDetails(null);
  };

  const getMoodColor = (rating) => {
    if (rating <= 3) return 'error';
    if (rating <= 6) return 'warning';
    return 'success';
  };

  const getAverageMood = (entries) => {
    if (entries.length === 0) return null;
    const sum = entries.reduce((acc, entry) => acc + entry.mood_rating, 0);
    return (sum / entries.length).toFixed(1);
  };

  const getRecentEntries = (entries, days = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return entries.filter(entry => new Date(entry.entry_date) >= cutoffDate);
  };

  if (user.role !== 'therapist') {
    return (
      <Container 
        maxWidth={false} 
        sx={{ 
          px: { xs: 2, sm: 4, md: 6, lg: 8, xl: 12 },
          mx: 'auto',
          maxWidth: '1400px'
        }}
      >
        <Typography variant="h4" gutterBottom>
          Brak dostępu
        </Typography>
        <Typography>
          Ta strona jest dostępna tylko dla terapeutów.
        </Typography>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        px: { xs: 2, sm: 4, md: 6, lg: 8, xl: 12 },
        mx: 'auto',
        maxWidth: '1400px'
      }}
    >
      <Typography variant="h4" gutterBottom>
        Pacjenci
      </Typography>

      <Grid container spacing={3}>
        {patients.map((patient) => {
          const recentEntries = getRecentEntries(patient.mood_entries || []);
          const averageMood = getAverageMood(recentEntries);

          return (
            <Grid item xs={12} sm={6} md={4} key={patient.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2 }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {patient.first_name} {patient.last_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {patient.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      Ostatni wpis nastroju:
                    </Typography>
                    {patient.last_mood_entry ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={`${patient.last_mood_entry.mood_rating}/10`}
                          color={getMoodColor(patient.last_mood_entry.mood_rating)}
                          size="small"
                        />
                        <Typography variant="caption">
                          {new Date(patient.last_mood_entry.entry_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">Brak wpisów</Typography>
                    )}
                  </Box>

                  {averageMood && (
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Średni nastrój (7 dni):
                      </Typography>
                      <Chip
                        label={`${averageMood}/10`}
                        color={getMoodColor(parseFloat(averageMood))}
                        size="small"
                      />
                    </Box>
                  )}

                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      Wpisy nastroju: {patient.mood_entries_count || 0}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">
                      Aktywne leki: {patient.active_medications_count || 0}
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleViewPatient(patient)}
                  >
                    Zobacz szczegóły
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {patients.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="textSecondary">
            Brak przypisanych pacjentów
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Pacjenci zostaną automatycznie przypisani po rozpoczęciu konwersacji
          </Typography>
        </Paper>
      )}

      {/* Dialog szczegółów pacjenta */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Szczegóły pacjenta: {selectedPatient?.first_name} {selectedPatient?.last_name}
        </DialogTitle>
        <DialogContent>
          {patientDetails && (
            <Box>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">
                    <Mood sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Wpisy nastroju ({patientDetails.moodEntries.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {patientDetails.moodEntries.length > 0 ? (
                    <List>
                      {patientDetails.moodEntries.slice(0, 10).map((entry, index) => (
                        <React.Fragment key={entry.id}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <span>{new Date(entry.entry_date).toLocaleDateString()}</span>
                                  <Chip
                                    label={`${entry.mood_rating}/10`}
                                    color={getMoodColor(entry.mood_rating)}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={entry.notes || 'Brak notatek'}
                            />
                          </ListItem>
                          {index < Math.min(patientDetails.moodEntries.length, 10) - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography color="textSecondary">
                      Brak wpisów nastroju
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">
                    <LocalPharmacy sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Leki ({patientDetails.medications.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {patientDetails.medications.length > 0 ? (
                    <List>
                      {patientDetails.medications.map((medication, index) => (
                        <React.Fragment key={medication.id}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <span>{medication.name}</span>
                                  <Chip
                                    label={medication.active ? 'Aktywny' : 'Nieaktywny'}
                                    color={medication.active ? 'success' : 'default'}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  {medication.dosage && <div>Dawka: {medication.dosage}</div>}
                                  {medication.frequency && <div>Częstotliwość: {medication.frequency}</div>}
                                  {medication.time_to_take && medication.time_to_take.length > 0 && (
                                    <div>Godziny: {medication.time_to_take.join(', ')}</div>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < patientDetails.medications.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography color="textSecondary">
                      Brak dodanych leków
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Zamknij</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Patients;
