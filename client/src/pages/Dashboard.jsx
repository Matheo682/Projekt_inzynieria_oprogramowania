import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  Mood,
  LocalPharmacy,
  Message,
  Notifications,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const { notifications } = useNotification();
  const [stats, setStats] = useState({
    moodEntries: 0,
    medications: 0,
    unreadMessages: 0,
    patients: 0,
  });
  const [recentMoodEntries, setRecentMoodEntries] = useState([]);
  const [upcomingMedications, setUpcomingMedications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Pobierz statystyki z obsługą błędów dla każdego endpointu
      let moodStats = { totalEntries: 0 };
      let medicationsData = { medications: [] };
      let messagesData = { unreadCount: 0 };
      let patientsCount = 0;
      let recentMoodData = { entries: [] };
      let todayMedicationsData = { medications: [] };

      // Pobierz dane tylko dla pacjentów
      if (user.role === 'patient') {
        try {
          const statsResponse = await axios.get('/api/mood/stats');
          moodStats = statsResponse.data;
        } catch (error) {
          console.error('Error fetching mood stats:', error);
        }

        try {
          const medicationsResponse = await axios.get('/api/medication');
          medicationsData = medicationsResponse.data;
        } catch (error) {
          console.error('Error fetching medications:', error);
        }

        try {
          const recentMoodResponse = await axios.get('/api/mood?limit=5');
          recentMoodData = recentMoodResponse.data;
        } catch (error) {
          console.error('Error fetching recent mood entries:', error);
        }

        try {
          const todayMedicationsResponse = await axios.get('/api/medication/today');
          todayMedicationsData = todayMedicationsResponse.data;
        } catch (error) {
          console.error('Error fetching today medications:', error);
        }
      }

      // Wiadomości dla wszystkich
      try {
        const messagesResponse = await axios.get('/api/messages/unread-count');
        messagesData = messagesResponse.data;
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }

      // Dane tylko dla terapeutów
      if (user.role === 'therapist') {
        try {
          const patientsResponse = await axios.get('/api/auth/patients');
          patientsCount = patientsResponse.data.length;
        } catch (error) {
          console.error('Error fetching patients:', error);
        }
      }

      setStats({
        moodEntries: moodStats.totalEntries || 0,
        medications: (medicationsData.medications || []).length,
        unreadMessages: messagesData.unreadCount || 0,
        patients: patientsCount,
      });

      setRecentMoodEntries(recentMoodData.entries || []);
      setUpcomingMedications(todayMedicationsData.medications || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const getMoodColor = (rating) => {
    if (rating <= 3) return 'error';
    if (rating <= 6) return 'warning';
    return 'success';
  };

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
        Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Witaj, {user.first_name}! Oto przegląd Twojej aktywności.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {user.role === 'patient' && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Wpisy nastroju"
                value={stats.moodEntries}
                icon={<Mood fontSize="large" />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Aktywne leki"
                value={stats.medications}
                icon={<LocalPharmacy fontSize="large" />}
                color="secondary"
              />
            </Grid>
          </>
        )}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Nieprzeczytane wiadomości"
            value={stats.unreadMessages}
            icon={<Message fontSize="large" />}
            color="info"
          />
        </Grid>
        {user.role === 'therapist' && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pacjenci"
              value={stats.patients}
              icon={<Notifications fontSize="large" />}
              color="success"
            />
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3}>
        {user.role === 'patient' && (
          <>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Ostatnie wpisy nastroju
                </Typography>
                {recentMoodEntries.length > 0 ? (
                  <List>
                    {recentMoodEntries.map((entry, index) => (
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
                        {index < recentMoodEntries.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography color="textSecondary">
                    Brak wpisów nastroju
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Dzisiejsze leki
                </Typography>
                {upcomingMedications.length > 0 ? (
                  <List>
                    {upcomingMedications.map((medication, index) => (
                      <React.Fragment key={medication.id}>
                        <ListItem>
                          <ListItemText
                            primary={medication.name}
                            secondary={`${medication.dosage} - ${medication.frequency}`}
                          />
                        </ListItem>
                        {index < upcomingMedications.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography color="textSecondary">
                    Brak leków na dziś
                  </Typography>
                )}
              </Paper>
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ostatnie powiadomienia
            </Typography>
            {notifications.slice(0, 5).length > 0 ? (
              <List>
                {notifications.slice(0, 5).map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem>
                      <ListItemText
                        primary={notification.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {notification.content}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(notification.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                      {!notification.read_at && (
                        <Chip label="Nowe" color="primary" size="small" />
                      )}
                    </ListItem>
                    {index < Math.min(notifications.length, 5) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary">
                Brak powiadomień
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
