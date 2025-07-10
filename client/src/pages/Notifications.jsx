import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Alert,
  Divider,
  Button
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  LocalPharmacy as MedicationIcon,
  Mood as MoodIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon
} from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';

const Notifications = () => {
  const { notifications, fetchNotifications } = useNotification();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageIcon color="primary" />;
      case 'medication':
        return <MedicationIcon color="secondary" />;
      case 'mood':
        return <MoodIcon color="warning" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'message':
        return 'primary';
      case 'medication':
        return 'secondary';
      case 'mood':
        return 'warning';
      default:
        return 'default';
    }
  };

  const markAsRead = async (notificationId) => {
    setLoading(true);
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      fetchNotifications(); // Odśwież listę powiadomień
    } catch (error) {
      console.error('Błąd oznaczania jako przeczytane:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    setLoading(true);
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      fetchNotifications(); // Odśwież listę powiadomień
    } catch (error) {
      console.error('Błąd usuwania powiadomienia:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await axios.put('/api/notifications/read-all');
      fetchNotifications(); // Odśwież listę powiadomień
    } catch (error) {
      console.error('Błąd oznaczania wszystkich jako przeczytane:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Teraz';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min temu`;
    } else if (diffInHours < 24) {
      return `${diffInHours} godz. temu`;
    } else if (diffInDays < 7) {
      return `${diffInDays} dni temu`;
    } else {
      return date.toLocaleDateString('pl-PL');
    }
  };

  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        mt: 4,
        px: { xs: 2, sm: 4, md: 6, lg: 8 },
        mx: 'auto',
        maxWidth: '1000px'
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Powiadomienia
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Zarządzaj swoimi powiadomieniami i alertami.
        </Typography>
      </Box>

      {notifications.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<MarkReadIcon />}
            onClick={markAllAsRead}
            disabled={loading}
          >
            Oznacz wszystkie jako przeczytane
          </Button>
        </Box>
      )}

      <Card>
        <CardContent>
          {notifications.length === 0 ? (
            <Alert severity="info">
              Nie masz żadnych powiadomień.
            </Alert>
          ) : (
            <List>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      backgroundColor: notification.read_at ? 'transparent' : 'action.hover',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {notification.title}
                          </Typography>
                          {!notification.read_at && (
                            <Chip
                              label="Nowe"
                              size="small"
                              color={getNotificationColor(notification.type)}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {notification.content}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(notification.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!notification.read_at && (
                        <IconButton
                          onClick={() => markAsRead(notification.id)}
                          disabled={loading}
                          size="small"
                          title="Oznacz jako przeczytane"
                        >
                          <MarkReadIcon />
                        </IconButton>
                      )}
                      <IconButton
                        onClick={() => deleteNotification(notification.id)}
                        disabled={loading}
                        size="small"
                        color="error"
                        title="Usuń powiadomienie"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Notifications;
