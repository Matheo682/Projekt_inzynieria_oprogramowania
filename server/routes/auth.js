import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getPool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Tymczasowe przechowywanie w pamięci (tylko do demonstracji)
let tempUsers = [];
let tempUserId = 1;

// Funkcja pomocnicza do sprawdzenia czy baza danych działa
const isDatabaseConnected = async () => {
  try {
    await getPool().query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
};

// Rejestracja
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('first_name').isLength({ min: 2 }),
  body('last_name').isLength({ min: 2 }),
  body('role').isIn(['patient', 'therapist'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Błąd walidacji',
        errors: errors.array() 
      });
    }

    const { email, password, first_name, last_name, role } = req.body;
    const dbConnected = await isDatabaseConnected();

    if (dbConnected) {
      // Próba użycia bazy danych
      try {
        // Sprawdź czy użytkownik już istnieje
        const existingUser = await getPool().query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ message: 'Użytkownik o tym adresie email już istnieje' });
        }

        // Zahashuj hasło
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Wstaw nowego użytkownika
        const result = await getPool().query(
          'INSERT INTO users (email, password, first_name, last_name, role, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, email, first_name, last_name, role',
          [email, hashedPassword, first_name, last_name, role]
        );

        const user = result.rows[0];
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          message: 'Użytkownik zarejestrowany pomyślnie',
          token,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
          }
        });
        return;
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Fallback do pamięci w przypadku błędu bazy
      }
    }

    // Fallback - używaj pamięci
    
    // Sprawdź czy użytkownik już istnieje w pamięci
    const existingUser = tempUsers.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik o tym adresie email już istnieje' });
    }

    // Zahashuj hasło
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Dodaj użytkownika do pamięci
    const newUser = {
      id: tempUserId++,
      email,
      password: hashedPassword,
      first_name,
      last_name,
      role,
      created_at: new Date()
    };
    tempUsers.push(newUser);

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Użytkownik zarejestrowany pomyślnie (tryb demonstracyjny)',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas rejestracji' });
  }
});

// Logowanie
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Błąd walidacji',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    const dbConnected = await isDatabaseConnected();

    if (dbConnected) {
      // Próba użycia bazy danych
      try {
        const result = await getPool().query(
          'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = $1',
          [email]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
          return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          message: 'Logowanie pomyślne',
          token,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
          }
        });
        return;
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Fallback do pamięci w przypadku błędu bazy
      }
    }

    // Fallback - używaj pamięci
    
    const user = tempUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Nieprawidłowe dane logowania' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Logowanie pomyślne (tryb demonstracyjny)',
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas logowania' });
  }
});

// Pobranie danych użytkownika
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const dbConnected = await isDatabaseConnected();

    if (dbConnected) {
      // Próba użycia bazy danych
      try {
        const result = await getPool().query(
          'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
          [req.user.userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        }

        const user = result.rows[0];
        res.json({
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
          }
        });
        return;
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Fallback do pamięci w przypadku błędu bazy
      }
    }

    // Fallback - używaj pamięci
    
    const user = tempUsers.find(u => u.id === req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania danych użytkownika' });
  }
});

// Weryfikacja profilu użytkownika
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const dbConnected = await isDatabaseConnected();

    if (dbConnected) {
      try {
        const result = await getPool().query(
          'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
          [userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
        }

        const user = result.rows[0];
        res.json({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
          }
        });

      } catch (dbError) {
        console.error('Błąd bazy danych przy pobieraniu profilu:', dbError);
        // Fallback do przechowywania w pamięci
        const user = tempUsers.find(u => u.id === userId);
        if (!user) {
          return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
        }

        res.json({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      }
    } else {
      // Fallback - przechowywanie w pamięci
      const user = tempUsers.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    }

  } catch (error) {
    console.error('Błąd pobierania profilu:', error);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania profilu' });
  }
});

// Pobierz pacjentów (tylko dla terapeutów)
router.get('/patients', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Sprawdź czy użytkownik jest terapeutą
    let user;
    try {
      const userResult = await getPool().query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      user = userResult.rows[0];
    } catch (dbError) {
      console.error('Database error, using fallback:', dbError);
      // Fallback do pamięci
      user = tempUsers.find(u => u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
    }

    if (user.role !== 'therapist') {
      return res.status(403).json({ message: 'Dostęp tylko dla terapeutów' });
    }

    // Pobierz pacjentów przypisanych do tego terapeuty
    try {
      const patientsResult = await getPool().query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.created_at, tp.created_at as assigned_at
        FROM users u
        INNER JOIN therapist_patients tp ON u.id = tp.patient_id
        WHERE tp.therapist_id = $1 AND u.role = 'patient'
        ORDER BY tp.created_at DESC
      `, [userId]);
      
      const patients = patientsResult.rows;
      
      // Dla każdego pacjenta pobierz statystyki
      const patientsWithStats = await Promise.all(patients.map(async (patient) => {
        try {
          // Pobierz licznik wpisów nastroju
          const moodCountResult = await getPool().query(
            'SELECT COUNT(*) as mood_count FROM mood_entries WHERE user_id = $1',
            [patient.id]
          );
          
          // Pobierz ostatni wpis nastroju
          const lastMoodResult = await getPool().query(
            'SELECT mood_rating, entry_date FROM mood_entries WHERE user_id = $1 ORDER BY entry_date DESC LIMIT 1',
            [patient.id]
          );
          
          // Pobierz wpisy nastroju z ostatnich 7 dni
          const recentMoodResult = await getPool().query(
            'SELECT mood_rating, entry_date FROM mood_entries WHERE user_id = $1 AND entry_date >= NOW() - INTERVAL \'7 days\' ORDER BY entry_date DESC',
            [patient.id]
          );
          
          // Pobierz licznik aktywnych leków
          const medicationsCountResult = await getPool().query(
            'SELECT COUNT(*) as medications_count FROM medications WHERE user_id = $1 AND active = true',
            [patient.id]
          );
          
          return {
            ...patient,
            mood_entries_count: parseInt(moodCountResult.rows[0].mood_count),
            active_medications_count: parseInt(medicationsCountResult.rows[0].medications_count),
            last_mood_entry: lastMoodResult.rows[0] || null,
            mood_entries: recentMoodResult.rows
          };
        } catch (statError) {
          console.error(`Error fetching stats for patient ${patient.id}:`, statError);
          return {
            ...patient,
            mood_entries_count: 0,
            active_medications_count: 0,
            last_mood_entry: null,
            mood_entries: []
          };
        }
      }));
      
      res.json(patientsWithStats);
    } catch (dbError) {
      console.error('Database error, using fallback:', dbError);
      // Fallback do pamięci - w trybie demonstracyjnym nie ma relacji
      res.json([]);
    }

  } catch (error) {
    console.error('Błąd pobierania pacjentów:', error);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania pacjentów' });
  }
});

// Pobierz terapeutów (dla pacjentów)
router.get('/therapists', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Sprawdź czy użytkownik jest pacjentem
    let user;
    try {
      const userResult = await getPool().query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      user = userResult.rows[0];
    } catch (dbError) {
      console.error('Database error, using fallback:', dbError);
      // Fallback do pamięci
      user = tempUsers.find(u => u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
    }

    if (user.role !== 'patient') {
      return res.status(403).json({ message: 'Dostęp tylko dla pacjentów' });
    }

    // Pobierz terapeutów z bazy danych
    try {
      const therapistsResult = await getPool().query(
        'SELECT id, email, first_name, last_name, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
        ['therapist']
      );
      
      res.json(therapistsResult.rows);
    } catch (dbError) {
      console.error('Database error, using fallback:', dbError);
      // Fallback do pamięci
      const therapists = tempUsers.filter(u => u.role === 'therapist').map(t => ({
        id: t.id,
        email: t.email,
        first_name: t.firstName,
        last_name: t.lastName,
        created_at: new Date().toISOString()
      }));
      
      res.json(therapists);
    }

  } catch (error) {
    console.error('Błąd pobierania terapeutów:', error);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania terapeutów' });
  }
});

// Utwórz relację terapeuta-pacjent
router.post('/create-relation', authenticateToken, async (req, res) => {
  try {
    const { therapistId, patientId } = req.body;
    
    if (!therapistId || !patientId) {
      return res.status(400).json({ message: 'therapistId i patientId są wymagane' });
    }

    // Sprawdź czy relacja już istnieje
    const existingRelation = await getPool().query(
      'SELECT id FROM therapist_patients WHERE therapist_id = $1 AND patient_id = $2',
      [therapistId, patientId]
    );

    if (existingRelation.rows.length > 0) {
      return res.status(400).json({ message: 'Relacja już istnieje' });
    }

    // Sprawdź czy terapeuta i pacjent istnieją
    const therapistCheck = await getPool().query(
      'SELECT id, role FROM users WHERE id = $1 AND role = $2',
      [therapistId, 'therapist']
    );

    const patientCheck = await getPool().query(
      'SELECT id, role FROM users WHERE id = $1 AND role = $2',
      [patientId, 'patient']
    );

    if (therapistCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Terapeuta nie znaleziony' });
    }

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pacjent nie znaleziony' });
    }

    // Utwórz relację
    const result = await getPool().query(
      'INSERT INTO therapist_patients (therapist_id, patient_id, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [therapistId, patientId]
    );

    res.status(201).json({
      message: 'Relacja utworzona pomyślnie',
      relation: result.rows[0]
    });

  } catch (error) {
    console.error('Błąd tworzenia relacji:', error);
    res.status(500).json({ message: 'Błąd serwera podczas tworzenia relacji' });
  }
});

// Pobierz wszystkich pacjentów (dla terapeuty do wyboru)
router.get('/all-patients', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ message: 'Dostęp tylko dla terapeutów' });
    }

    const dbConnected = await isDatabaseConnected();

    if (dbConnected) {
      try {
        const allPatientsResult = await getPool().query(
          'SELECT id, email, first_name, last_name, created_at FROM users WHERE role = $1 ORDER BY first_name, last_name',
          ['patient']
        );
        
        res.json(allPatientsResult.rows);
        return;
      } catch (dbError) {
        console.error('Database error, using fallback:', dbError);
      }
    }
    
    // Fallback do pamięci
    const allPatients = tempUsers.filter(u => u.role === 'patient').map(p => ({
      id: p.id,
      email: p.email,
      first_name: p.first_name,
      last_name: p.last_name,
      created_at: new Date().toISOString()
    }));
    
    res.json(allPatients);

  } catch (error) {
    console.error('Błąd pobierania wszystkich pacjentów:', error);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania pacjentów' });
  }
});

// Usuń relację terapeuta-pacjent
router.delete('/remove-relation', authenticateToken, async (req, res) => {
  try {
    const { therapistId, patientId } = req.body;
    
    // Sprawdź czy terapeuta próbuje usunąć tylko swoją relację
    if (req.user.id !== parseInt(therapistId)) {
      return res.status(403).json({ message: 'Możesz usuwać tylko swoje relacje' });
    }
    
    if (!therapistId || !patientId) {
      return res.status(400).json({ message: 'therapistId i patientId są wymagane' });
    }

    const dbConnected = await isDatabaseConnected();

    if (dbConnected) {
      try {
        const result = await getPool().query(
          'DELETE FROM therapist_patients WHERE therapist_id = $1 AND patient_id = $2 RETURNING *',
          [therapistId, patientId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Relacja nie znaleziona' });
        }

        res.json({
          message: 'Relacja usunięta pomyślnie',
          deletedRelation: result.rows[0]
        });
        return;
      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({ message: 'Błąd bazy danych' });
      }
    }

    // W trybie fallback (pamięć) nie ma relacji do usunięcia
    res.status(404).json({ message: 'Relacja nie znaleziona (tryb demonstracyjny)' });

  } catch (error) {
    console.error('Błąd usuwania relacji:', error);
    res.status(500).json({ message: 'Błąd serwera podczas usuwania relacji' });
  }
});

export default router;
