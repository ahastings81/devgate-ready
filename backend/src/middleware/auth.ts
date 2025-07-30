// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

export interface AuthRequest extends Request {
  userId: number;
  userEmail: string;     // add this
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as AuthRequest).userId = payload.userId;
    (req as AuthRequest).userEmail = payload.email;  // set email
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
