import express from 'express';
import { body, validationResult } from 'express-validator';
import { getPool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Dodaj lek
router.post('/', authenticateToken, [
  body('name').isLength({ min: 1, max: 255 }),
  body('dosage').optional().isLength({ max: 100 }),
  body('frequency').optional().isLength({ max: 100 }),
  body('timeToTake').optional().isArray(),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, dosage, frequency, timeToTake, notes } = req.body;
    const userId = req.user.id;

    const result = await getPool().query(
      'INSERT INTO medications (user_id, name, dosage, frequency, time_to_take, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, name, dosage, frequency, timeToTake, notes]
    );

    res.status(201).json({
      message: 'Medication added successfully',
      medication: result.rows[0]
    });

  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz leki użytkownika
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { active = true } = req.query;

    const result = await getPool().query(
      'SELECT * FROM medications WHERE user_id = $1 AND active = $2 ORDER BY created_at DESC',
      [userId, active]
    );

    res.json({
      medications: result.rows
    });

  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Aktualizuj lek
router.put('/:id', authenticateToken, [
  body('name').optional().isLength({ min: 1, max: 255 }),
  body('dosage').optional().isLength({ max: 100 }),
  body('frequency').optional().isLength({ max: 100 }),
  body('timeToTake').optional().isArray(),
  body('notes').optional().isLength({ max: 1000 }),
  body('active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Sprawdź czy lek należy do użytkownika
    const medicationCheck = await getPool().query(
      'SELECT id FROM medications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (medicationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    // Dynamicznie buduj zapytanie UPDATE
    const updateFields = [];
    const updateValues = [];
    let paramCounter = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = key === 'timeToTake' ? 'time_to_take' : key;
        updateFields.push(`${dbField} = $${paramCounter}`);
        updateValues.push(value);
        paramCounter++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id, userId);
    const query = `UPDATE medications SET ${updateFields.join(', ')} WHERE id = $${paramCounter} AND user_id = $${paramCounter + 1} RETURNING *`;

    const result = await getPool().query(query, updateValues);

    res.json({
      message: 'Medication updated successfully',
      medication: result.rows[0]
    });

  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Usuń lek (soft delete - ustaw active na false)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await getPool().query(
      'UPDATE medications SET active = false WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json({
      message: 'Medication deleted successfully'
    });

  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz leki wymagające powiadomienia
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentTime = new Date();
    const notificationTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // 1 godzina do przodu

    const result = await getPool().query(`
      SELECT m.*, 
             unnest(m.time_to_take) as medication_time
      FROM medications m 
      WHERE m.user_id = $1 
        AND m.active = true 
        AND m.time_to_take IS NOT NULL
    `, [userId]);

    const medicationsNeedingNotification = result.rows.filter(med => {
      const medTime = new Date();
      const [hours, minutes] = med.medication_time.split(':');
      medTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      return medTime <= notificationTime && medTime > currentTime;
    });

    res.json({
      medications: medicationsNeedingNotification
    });

  } catch (error) {
    console.error('Get medication notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz dzisiejsze leki do wzięcia
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();

    const result = await getPool().query(`
      SELECT m.*, 
             unnest(m.time_to_take) as medication_time
      FROM medications m 
      WHERE m.user_id = $1 
        AND m.active = true 
        AND m.time_to_take IS NOT NULL
        AND array_length(m.time_to_take, 1) > 0
    `, [userId]);

    // Filtruj leki na dzisiaj (te które mają być wzięte dziś)
    const todayMedications = result.rows.map(med => {
      const [hours, minutes] = med.medication_time.split(':');
      const medicationHour = parseInt(hours);
      const medicationMinute = parseInt(minutes);
      
      return {
        ...med,
        time: med.medication_time,
        isPending: (medicationHour > currentHour) || 
                  (medicationHour === currentHour && medicationMinute > currentMinute),
        isPastDue: (medicationHour < currentHour) || 
                  (medicationHour === currentHour && medicationMinute < currentMinute)
      };
    }).sort((a, b) => {
      // Sortuj według czasu
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return timeA[0] - timeB[0] || timeA[1] - timeB[1];
    });

    res.json({
      medications: todayMedications
    });

  } catch (error) {
    console.error('Get today medications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz leki pacjenta (dla terapeuty)
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

    const { active = true } = req.query;

    const result = await getPool().query(
      'SELECT * FROM medications WHERE user_id = $1 AND active = $2 ORDER BY created_at DESC',
      [patientId, active]
    );

    res.json({
      medications: result.rows
    });

  } catch (error) {
    console.error('Get patient medications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
