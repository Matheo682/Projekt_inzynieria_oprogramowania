import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Send, Person } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const { user } = useAuth();
  const { showSnackbar } = useNotification();

  useEffect(() => {
    fetchConversations();
    if (user.role === 'patient') {
      fetchTherapists();
    } else {
      fetchPatients();
    }
  }, [user.role]);

  useEffect(() => {
    if (selectedConversation && selectedConversation.other_user_id) {
      fetchMessages(selectedConversation.other_user_id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/messages/conversations');
      // Backend zwraca {conversations: []}, więc wyciągamy tablicę
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      showSnackbar('Błąd podczas pobierania konwersacji', 'error');
      setConversations([]); // Fallback do pustej tablicy
    }
  };

  const fetchMessages = async (recipientId) => {
    try {
      const response = await axios.get(`/api/messages/${recipientId}`);
      // Backend zwraca {messages: []}, więc wyciągamy tablicę
      setMessages(response.data.messages || []);
      // Oznacz wiadomości jako przeczytane
      await markMessagesAsRead(recipientId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showSnackbar('Błąd podczas pobierania wiadomości', 'error');
      setMessages([]); // Fallback do pustej tablicy
    }
  };

  const markMessagesAsRead = async (senderId) => {
    try {
      await axios.put(`/api/messages/mark-read/${senderId}`);
      fetchConversations(); // Odśwież listę konwersacji
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchTherapists = async () => {
    try {
      const response = await axios.get('/api/auth/therapists');
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Error fetching therapists:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/auth/patients');
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await axios.post('/api/messages', {
        recipientId: selectedConversation.other_user_id,
        content: newMessage,
      });

      setNewMessage('');
      fetchMessages(selectedConversation.other_user_id);
      fetchConversations();
      showSnackbar('Wiadomość została wysłana', 'success');
    } catch (error) {
      console.error('Error sending message:', error);
      showSnackbar('Błąd podczas wysyłania wiadomości', 'error');
    }
  };

  const startNewConversation = async () => {
    if (!selectedUser) return;

    try {
      await axios.post('/api/messages', {
        recipientId: selectedUser,
        content: 'Rozpoczynam nową konwersację',
      });

      const newContact = availableUsers.find(u => u.id === selectedUser);
      setSelectedConversation(newContact);
      setNewConversationOpen(false);
      setSelectedUser('');
      fetchConversations();
      showSnackbar('Nowa konwersacja została rozpoczęta', 'success');
    } catch (error) {
      console.error('Error starting new conversation:', error);
      showSnackbar('Błąd podczas rozpoczynania konwersacji', 'error');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
        Wiadomości
      </Typography>

      <Box display="flex" height="70vh" gap={2}>
        {/* Lista konwersacji */}
        <Paper sx={{ width: '30%', overflow: 'auto' }}>
          <Box p={2} borderBottom={1} borderColor="divider">
            <Typography variant="h6">Konwersacje</Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => setNewConversationOpen(true)}
            >
              Nowa konwersacja
            </Button>
          </Box>
          <List>
            {conversations.map((conversation) => (
              <React.Fragment key={conversation.other_user_id}>
                <ListItem
                  button
                  selected={selectedConversation?.other_user_id === conversation.other_user_id}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <Avatar sx={{ mr: 2 }}>
                    <Person />
                  </Avatar>
                  <ListItemText
                    primary={`${conversation.first_name} ${conversation.last_name}`}
                    secondary={
                      <span>{conversation.role === 'therapist' ? 'Terapeuta' : 'Pacjent'}</span>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
            {conversations.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="Brak konwersacji"
                  secondary="Rozpocznij nową konwersację"
                />
              </ListItem>
            )}
          </List>
        </Paper>

        {/* Okno wiadomości */}
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <>
              <Box p={2} borderBottom={1} borderColor="divider">
                <Typography variant="h6">
                  {selectedConversation.first_name} {selectedConversation.last_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedConversation.role === 'therapist' ? 'Terapeuta' : 'Pacjent'}
                </Typography>
              </Box>

              <Box flex={1} overflow="auto" p={2}>
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    mb={2}
                    display="flex"
                    justifyContent={message.sender_id === user.id ? 'flex-end' : 'flex-start'}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        bgcolor: message.sender_id === user.id ? 'primary.light' : 'grey.100',
                        color: message.sender_id === user.id ? 'white' : 'text.primary',
                      }}
                    >
                      <Typography variant="body1">
                        {message.content}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
                        {new Date(message.created_at).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>

              <Box p={2} borderTop={1} borderColor="divider">
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Napisz wiadomość..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <IconButton
                    color="primary"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send />
                  </IconButton>
                </Box>
              </Box>
            </>
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <Typography variant="h6" color="textSecondary">
                Wybierz konwersację, aby wyświetlić wiadomości
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Dialog nowej konwersacji */}
      <Dialog open={newConversationOpen} onClose={() => setNewConversationOpen(false)}>
        <DialogTitle>Nowa konwersacja</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>
              {user.role === 'patient' ? 'Wybierz terapeutę' : 'Wybierz pacjenta'}
            </InputLabel>
            <Select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              label={user.role === 'patient' ? 'Wybierz terapeutę' : 'Wybierz pacjenta'}
            >
              {availableUsers
                .filter(u => !conversations.some(c => c.other_user_id === u.id))
                .map((userOption) => (
                  <MenuItem key={userOption.id} value={userOption.id}>
                    {userOption.first_name} {userOption.last_name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConversationOpen(false)}>Anuluj</Button>
          <Button onClick={startNewConversation} variant="contained" disabled={!selectedUser}>
            Rozpocznij
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Messages;
