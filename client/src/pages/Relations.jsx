import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Relations = () => {
  const { user } = useAuth();
  const [myPatients, setMyPatients] = useState([]);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Pobierz moich pacjentów (już przypisanych)
      const myPatientsResponse = await fetch('/api/auth/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const myPatientsData = await myPatientsResponse.json();
      setMyPatients(Array.isArray(myPatientsData) ? myPatientsData : []);

      // Pobierz wszystkich pacjentów (do wyboru tych nieprzypisanych)
      const allPatientsResponse = await fetch('/api/auth/all-patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (allPatientsResponse.ok) {
        const allPatientsData = await allPatientsResponse.json();
        const allPatients = Array.isArray(allPatientsData) ? allPatientsData : [];
        
        // Filtruj pacjentów - pokaż tylko tych, którzy nie są jeszcze przypisani do tego terapeuty
        const myPatientIds = myPatientsData.map(p => p.id);
        const available = allPatients.filter(patient => !myPatientIds.includes(patient.id));
        setAvailablePatients(available);
      } else {
        // Fallback - jeśli endpoint nie istnieje, użyj pustej listy
        setAvailablePatients([]);
      }

    } catch (error) {
      console.error('Błąd pobierania danych:', error);
      setError('Błąd pobierania danych');
    }
  };

  const handleAssignPatient = async () => {
    if (!selectedPatient) {
      setError('Wybierz pacjenta');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/create-relation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          therapistId: user.id, // Zawsze przypisuj do siebie
          patientId: selectedPatient
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Błąd przypisywania pacjenta');
      }

      setSuccess('Pacjent został przypisany pomyślnie!');
      setOpen(false);
      setSelectedPatient('');
      
      // Odśwież dane
      fetchData();
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (error) {
      console.error('Błąd przypisywania pacjenta:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePatient = async (patientId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego pacjenta z Twojej listy?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/remove-relation', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          therapistId: user.id,
          patientId: patientId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Błąd usuwania pacjenta');
      }

      setSuccess('Pacjent został usunięty z Twojej listy');
      
      // Odśwież dane
      fetchData();
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (error) {
      console.error('Błąd usuwania pacjenta:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sprawdź czy użytkownik ma uprawnienia (tylko terapeuci)
  if (user?.role !== 'therapist') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Dostęp ograniczony. Ta strona jest dostępna tylko dla terapeutów.
        </Alert>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        mt: 4,
        px: { xs: 2, sm: 4, md: 6, lg: 8, xl: 12 },
        mx: 'auto',
        maxWidth: '1200px'
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Moi Pacjenci
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Zarządzaj pacjentami przypisanymi do Twojej opieki terapeutycznej.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Karta z moimi pacjentami */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Przypisani Pacjenci ({myPatients.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
              disabled={availablePatients.length === 0}
            >
              Przypisz Pacjenta
            </Button>
          </Box>

          {myPatients.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Nie masz jeszcze przypisanych pacjentów
            </Typography>
          ) : (
            <List>
              {myPatients.map((patient) => (
                <ListItem key={patient.id}>
                  <ListItemText
                    primary={`${patient.first_name} ${patient.last_name}`}
                    secondary={patient.email}
                  />
                  <Chip label="Mój pacjent" size="small" color="primary" />
                  <IconButton 
                    edge="end" 
                    aria-label="usuń"
                    color="error"
                    sx={{ ml: 1 }}
                    onClick={() => handleRemovePatient(patient.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Dostępni pacjenci do przypisania */}
      {availablePatients.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dostępni Pacjenci do Przypisania ({availablePatients.length})
            </Typography>
            <List dense>
              {availablePatients.map((patient) => (
                <ListItem key={patient.id}>
                  <ListItemText
                    primary={`${patient.first_name} ${patient.last_name}`}
                    secondary={patient.email}
                  />
                  <Chip label="Dostępny" size="small" color="default" />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Dialog przypisywania pacjenta */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Przypisz Pacjenta</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Wybierz Pacjenta</InputLabel>
              <Select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                label="Wybierz Pacjenta"
              >
                {availablePatients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} ({patient.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {availablePatients.length === 0 && (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Wszyscy dostępni pacjenci są już przypisani do Ciebie lub innych terapeutów.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Anuluj</Button>
          <Button 
            onClick={handleAssignPatient} 
            variant="contained"
            disabled={loading || !selectedPatient}
          >
            {loading ? 'Przypisywanie...' : 'Przypisz Pacjenta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Relations;
