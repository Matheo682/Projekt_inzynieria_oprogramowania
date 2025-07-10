import express from 'express';
import { body, validationResult } from 'express-validator';
import { getPool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Wyślij wiadomość
router.post('/', authenticateToken, [
  body('recipientId').isInt(),
  body('content').isLength({ min: 1, max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    // Sprawdź czy odbiorca istnieje
    const recipientCheck = await getPool().query(
      'SELECT id, role FROM users WHERE id = $1',
      [recipientId]
    );

    if (recipientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const recipient = recipientCheck.rows[0];

    // Sprawdź czy istnieje relacja terapeuta-pacjent
    let hasRelation = false;

    if (req.user.role === 'patient' && recipient.role === 'therapist') {
      const relation = await getPool().query(
        'SELECT id FROM therapist_patients WHERE therapist_id = $1 AND patient_id = $2',
        [recipientId, senderId]
      );
      hasRelation = relation.rows.length > 0;
    } else if (req.user.role === 'therapist' && recipient.role === 'patient') {
      const relation = await getPool().query(
        'SELECT id FROM therapist_patients WHERE therapist_id = $1 AND patient_id = $2',
        [senderId, recipientId]
      );
      hasRelation = relation.rows.length > 0;
    }

    if (!hasRelation) {
      return res.status(403).json({ error: 'No therapeutic relationship exists' });
    }

    // Wyślij wiadomość
    const result = await getPool().query(
      'INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *',
      [senderId, recipientId, content]
    );

    // Utwórz powiadomienie dla odbiorcy
    await getPool().query(
      'INSERT INTO notifications (user_id, type, title, content) VALUES ($1, $2, $3, $4)',
      [recipientId, 'message', 'Nowa wiadomość', `Otrzymałeś nową wiadomość od ${req.user.first_name} ${req.user.last_name}`]
    );

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: result.rows[0]
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz konwersacje użytkownika
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getPool().query(`
      SELECT DISTINCT
        CASE 
          WHEN m.sender_id = $1 THEN m.recipient_id 
          ELSE m.sender_id 
        END as other_user_id,
        u.first_name,
        u.last_name,
        u.role,
        (SELECT content FROM messages m2 
         WHERE (m2.sender_id = $1 AND m2.recipient_id = CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END)
            OR (m2.recipient_id = $1 AND m2.sender_id = CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END)
         ORDER BY m2.created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages m2 
         WHERE (m2.sender_id = $1 AND m2.recipient_id = CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END)
            OR (m2.recipient_id = $1 AND m2.sender_id = CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END)
         ORDER BY m2.created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages m2 
         WHERE m2.recipient_id = $1 
           AND m2.sender_id = CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END
           AND m2.read_at IS NULL) as unread_count
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END
      WHERE m.sender_id = $1 OR m.recipient_id = $1
      ORDER BY last_message_time DESC
    `, [userId]);

    res.json({
      conversations: result.rows
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz liczbę nieprzeczytanych wiadomości
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    try {
      const result = await getPool().query(
        'SELECT COUNT(*) as unread_count FROM messages WHERE recipient_id = $1 AND read_at IS NULL',
        [userId]
      );

      res.json({
        unreadCount: parseInt(result.rows[0].unread_count)
      });

    } catch (dbError) {
      console.error('Błąd bazy danych przy pobieraniu liczby nieprzeczytanych wiadomości:', dbError);
      // Fallback - zwróć 0
      res.json({
        unreadCount: 0
      });
    }

  } catch (error) {
    console.error('Błąd pobierania liczby nieprzeczytanych wiadomości:', error);
    res.status(500).json({ message: 'Błąd serwera podczas pobierania liczby nieprzeczytanych wiadomości' });
  }
});

// Oznacz wiadomości jako przeczytane
router.put('/mark-read/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    // Oznacz wszystkie wiadomości z danym użytkownikiem jako przeczytane
    const result = await getPool().query(
      'UPDATE messages SET read_at = NOW() WHERE sender_id = $1 AND recipient_id = $2 AND read_at IS NULL',
      [otherUserId, userId]
    );

    res.json({
      message: 'Messages marked as read',
      updated: result.rowCount
    });

  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz wiadomości z konkretnym użytkownikiem
router.get('/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    // Sprawdź relację terapeuta-pacjent
    const relationCheck = await getPool().query(`
      SELECT id FROM therapist_patients 
      WHERE (therapist_id = $1 AND patient_id = $2) 
         OR (therapist_id = $2 AND patient_id = $1)
    `, [userId, otherUserId]);

    if (relationCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No therapeutic relationship exists' });
    }

    // Pobierz wiadomości
    const result = await getPool().query(`
      SELECT m.*, 
             s.first_name as sender_first_name,
             s.last_name as sender_last_name,
             s.role as sender_role
      FROM messages m
      JOIN users s ON s.id = m.sender_id
      WHERE (m.sender_id = $1 AND m.recipient_id = $2)
         OR (m.sender_id = $2 AND m.recipient_id = $1)
      ORDER BY m.created_at DESC
      LIMIT $3 OFFSET $4
    `, [userId, otherUserId, limit, offset]);

    // Oznacz wiadomości jako przeczytane
    await getPool().query(
      'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE recipient_id = $1 AND sender_id = $2 AND read_at IS NULL',
      [userId, otherUserId]
    );

    res.json({
      messages: result.rows.reverse() // Odwróć kolejność żeby najnowsze były na końcu
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz pacjentów terapeuty (do wyboru odbiorcy wiadomości)
router.get('/therapist/patients', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const therapistId = req.user.id;

    const result = await getPool().query(`
      SELECT u.id, u.first_name, u.last_name, u.email
      FROM users u
      JOIN therapist_patients tp ON tp.patient_id = u.id
      WHERE tp.therapist_id = $1
      ORDER BY u.first_name, u.last_name
    `, [therapistId]);

    res.json({
      patients: result.rows
    });

  } catch (error) {
    console.error('Get therapist patients error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Przypisz pacjenta do terapeuty (pomocnicze endpoint)
router.post('/assign-patient', authenticateToken, [
  body('patientId').isInt()
], async (req, res) => {
  try {
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ error: 'Only therapists can assign patients' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId } = req.body;
    const therapistId = req.user.id;

    // Sprawdź czy pacjent istnieje i ma rolę 'patient'
    const patientCheck = await getPool().query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [patientId, 'patient']
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Sprawdź czy relacja już istnieje
    const existingRelation = await getPool().query(
      'SELECT id FROM therapist_patients WHERE therapist_id = $1 AND patient_id = $2',
      [therapistId, patientId]
    );

    if (existingRelation.rows.length > 0) {
      return res.status(400).json({ error: 'Patient already assigned to this therapist' });
    }

    // Utwórz relację
    await getPool().query(
      'INSERT INTO therapist_patients (therapist_id, patient_id) VALUES ($1, $2)',
      [therapistId, patientId]
    );

    res.status(201).json({
      message: 'Patient assigned successfully'
    });

  } catch (error) {
    console.error('Assign patient error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz ostatnie wiadomości z pacjentem (dla terapeuty)
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

    const { limit = 10 } = req.query;

    // Pobierz ostatnie wiadomości z tym pacjentem
    const result = await getPool().query(`
      SELECT m.*, 
             s.first_name as sender_first_name,
             s.last_name as sender_last_name,
             s.role as sender_role
      FROM messages m
      JOIN users s ON s.id = m.sender_id
      WHERE (m.sender_id = $1 AND m.recipient_id = $2)
         OR (m.sender_id = $2 AND m.recipient_id = $1)
      ORDER BY m.created_at DESC
      LIMIT $3
    `, [therapistId, patientId, limit]);

    res.json({
      messages: result.rows
    });

  } catch (error) {
    console.error('Get patient messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
