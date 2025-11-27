import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar se o usuário ainda existe
    const result = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = {
      id: decoded.userId,
      email: result.rows[0].email
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(403).json({ error: 'Token inválido' });
  }
};

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length > 0) {
      req.user = {
        id: decoded.userId,
        email: result.rows[0].email
      };
    }
  } catch (error) {
    // Ignora erros de token em autenticação opcional
  }

  next();
};
