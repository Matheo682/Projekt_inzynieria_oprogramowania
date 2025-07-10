import express from 'express';
import { getPool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Pobierz powiadomienia użytkownika
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, unreadOnly = false } = req.query;

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const queryParams = [userId];

    if (unreadOnly === 'true') {
      query += ' AND read_at IS NULL';
    }

    query += ' ORDER BY created_at DESC LIMIT $2';
    queryParams.push(limit);

    const result = await getPool().query(query, queryParams);

    res.json({
      notifications: result.rows
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Oznacz powiadomienie jako przeczytane
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await getPool().query(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Oznacz wszystkie powiadomienia jako przeczytane
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await getPool().query(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );

    res.json({
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pobierz liczbę nieprzeczytanych powiadomień
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getPool().query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );

    res.json({
      unreadCount: parseInt(result.rows[0].count)
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Usuń powiadomienie
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await getPool().query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Utwórz powiadomienie o lekach (uruchamiane przez cron job lub scheduler)
router.post('/medication-reminder', authenticateToken, async (req, res) => {
  try {
    const currentTime = new Date();
    const reminderTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // 1 godzina do przodu

    // Znajdź leki które wymagają powiadomienia
    const medicationsResult = await getPool().query(`
      SELECT m.*, u.id as user_id, u.first_name
      FROM medications m
      JOIN users u ON u.id = m.user_id
      WHERE m.active = true 
        AND m.time_to_take IS NOT NULL
        AND array_length(m.time_to_take, 1) > 0
    `);

    const notifications = [];

    for (const medication of medicationsResult.rows) {
      for (const timeStr of medication.time_to_take) {
        const medTime = new Date();
        const [hours, minutes] = timeStr.split(':');
        medTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Sprawdź czy czas leku jest w ciągu następnej godziny
        if (medTime <= reminderTime && medTime > currentTime) {
          // Sprawdź czy powiadomienie już nie zostało utworzone
          const existingNotification = await getPool().query(
            `SELECT id FROM notifications 
             WHERE user_id = $1 
               AND type = 'medication' 
               AND title LIKE $2 
               AND created_at::date = CURRENT_DATE`,
            [medication.user_id, `%${medication.name}%`]
          );

          if (existingNotification.rows.length === 0) {
            await getPool().query(
              'INSERT INTO notifications (user_id, type, title, content) VALUES ($1, $2, $3, $4)',
              [
                medication.user_id,
                'medication',
                'Przypomnienie o leku',
                `Czas na wzięcie leku: ${medication.name} (${medication.dosage || 'dawka nieokreślona'}) o ${timeStr}`
              ]
            );
            notifications.push({
              userId: medication.user_id,
              medicationName: medication.name,
              time: timeStr
            });
          }
        }
      }
    }

    res.json({
      message: 'Medication reminders processed',
      createdNotifications: notifications.length,
      notifications
    });

  } catch (error) {
    console.error('Create medication reminder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
