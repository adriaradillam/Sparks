import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sparks_super_secret_jwt_key_2026';

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado. Token requerido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

export const generateToken = (id: number, email: string): string => {
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '30d' });
};
