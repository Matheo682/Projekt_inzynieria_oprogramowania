import express from 'express';
import { body, validationResult } from 'express-validator';
import { getPool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Dodaj wpis do dziennika nastroju
router.post('/', authenticateToken, [
  body('moodRating').isInt({ min: 1, max: 10 }),
  body('notes').optional().isLength({ max: 1000 }),
  body('entryDate').isISO8601().toDate() // Zmiana: używamy isISO8601() zamiast isDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { moodRating, notes, entryDate } = req.body;
    const userId = req.user.id;

    // Zawsze dodaj nowy wpis (pozwalamy na wiele wpisów dziennie)
    const result = await getPool().query(
      'INSERT INTO mood_entries (user_id, mood_rating, notes, entry_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, moodRating, notes, entryDate]
    );

    res.status(201).json({
      message: 'Mood entry created successfully',
      entry: result.rows[0]
    });

  } catch (error) {
    console.error('Mood entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Edytuj wpis do dziennika nastroju
router.put('/:id', authenticateToken, [
  body('moodRating').isInt({ min: 1, max: 10 }),
  body('notes').optional().isLength({ max: 1000 }),
  body('entryDate').isISO8601().toDate()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { moodRating, notes, entryDate } = req.body;
    const userId = req.user.id;

    // Sprawdź czy wpis należy do użytkownika
    const existingEntry = await getPool().query(
      'SELECT id FROM mood_entries WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingEntry.rows.length === 0) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    // Aktualizuj wpis
    const result = await getPool().query(
      'UPDATE mood_entries SET mood_rating = $1, notes = $2, entry_date = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [moodRating, notes, entryDate, id, userId]
    );

    res.json({
      message: 'Mood entry updated successfully',
      entry: result.rows[0]
    });

  } catch (error) {
    console.error('Update mood entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz wpisy dziennika nastroju
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit = 30 } = req.query;

    let query = 'SELECT * FROM mood_entries WHERE user_id = $1';
    let queryParams = [userId];

    if (startDate && endDate) {
      query += ' AND entry_date BETWEEN $2 AND $3';
      queryParams.push(startDate, endDate);
    }

    query += ' ORDER BY entry_date DESC, created_at DESC LIMIT $' + (queryParams.length + 1);
    queryParams.push(limit);

    const result = await getPool().query(query, queryParams);

    res.json({
      entries: result.rows
    });

  } catch (error) {
    console.error('Get mood entries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz wpisy pacjenta (dla terapeuty)
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const therapistId = req.user.id;

    // Sprawdź czy terapeuta ma dostęp do tego pacjenta
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const relationCheck = await getPool().query(
      'SELECT id FROM therapist_patients WHERE therapist_id = $1 AND patient_id = $2',
      [therapistId, patientId]
    );

    if (relationCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Patient not assigned to this therapist' });
    }

    const { startDate, endDate, limit = 30 } = req.query;

    let query = 'SELECT * FROM mood_entries WHERE user_id = $1';
    let queryParams = [patientId];

    if (startDate && endDate) {
      query += ' AND entry_date BETWEEN $2 AND $3';
      queryParams.push(startDate, endDate);
    }

    query += ' ORDER BY entry_date DESC, created_at DESC LIMIT $' + (queryParams.length + 1);
    queryParams.push(limit);

    const result = await getPool().query(query, queryParams);

    res.json({
      entries: result.rows
    });

  } catch (error) {
    console.error('Get patient mood entries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Usuń wpis dziennika nastroju
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await getPool().query(
      'DELETE FROM mood_entries WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    res.json({
      message: 'Mood entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete mood entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz statystyki nastroju użytkownika
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    try {
      // Statystyki z bazy danych
      const avgResult = await getPool().query(
        'SELECT AVG(mood_rating)::numeric(3,1) as avg_mood FROM mood_entries WHERE user_id = $1',
        [userId]
      );

      const countResult = await getPool().query(
        'SELECT COUNT(*) as total_entries FROM mood_entries WHERE user_id = $1',
        [userId]
      );

      const recentResult = await getPool().query(
        'SELECT mood_rating, notes, entry_date FROM mood_entries WHERE user_id = $1 ORDER BY entry_date DESC LIMIT 7',
        [userId]
      );

      const weeklyResult = await getPool().query(
        'SELECT AVG(mood_rating)::numeric(3,1) as avg_mood FROM mood_entries WHERE user_id = $1 AND entry_date >= CURRENT_DATE - INTERVAL \'7 days\'',
        [userId]
      );

      res.json({
        avgMood: parseFloat(avgResult.rows[0].avg_mood) || 0,
        totalEntries: parseInt(countResult.rows[0].total_entries),
        weeklyAvg: parseFloat(weeklyResult.rows[0].avg_mood) || 0,
        recentEntries: recentResult.rows
      });

    } catch (dbError) {
      console.error('Błąd bazy danych przy pobieraniu statystyk:', dbError);
      // Fallback - zwróć puste statystyki
      res.json({
        avgMood: 0,
        totalEntries: 0,
        weeklyAvg: 0,
        recentEntries: []
      });
    }

  } catch (error) {
    console.error('Błąd pobierania statystyk nastroju:', error);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania statystyk' });
  }
});

export default router;
