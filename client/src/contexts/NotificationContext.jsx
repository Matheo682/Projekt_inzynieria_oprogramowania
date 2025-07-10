import React, { createContext, useState, useContext, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const { user } = useAuth();

  // Pobieranie powiadomień z serwera
  const fetchNotifications = async () => {
    if (!user) return;
    
    // Sprawdź czy token jest ustawiony w axios
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }
    
    try {
      const response = await axios.get('/api/notifications');
      // Backend zwraca {notifications: []}, więc wyciągamy tablicę
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]); // Fallback do pustej tablicy
    }
  };

  useEffect(() => {
    if (user) {
      // Dodaj małe opóźnienie, żeby axios interceptor zdążył się skonfigurować
      const timeoutId = setTimeout(() => {
        fetchNotifications();
      }, 100);
      
      // Sprawdzanie nowych powiadomień co 30 sekund
      const interval = setInterval(fetchNotifications, 30000);
      return () => {
        clearTimeout(timeoutId);
        clearInterval(interval);
      };
    }
  }, [user]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const unreadCount = (notifications && Array.isArray(notifications)) 
    ? notifications.filter(n => !n.read_at).length 
    : 0;

  const value = {
    notifications,
    unreadCount,
    showSnackbar,
    markAsRead,
    fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
