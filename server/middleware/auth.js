import jwt from 'jsonwebtoken';
import { getPool } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    try {
      // Sprawdź czy użytkownik nadal istnieje w bazie
      const result = await getPool().query(
        'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        first_name: result.rows[0].first_name,
        last_name: result.rows[0].last_name,
        role: result.rows[0].role
      };
      next();
    } catch (dbError) {
      console.error('Database error in auth middleware, using token data:', dbError);
      // Fallback - użyj danych z tokenu
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      next();
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
