import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hash }
    });
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not fetch user' });
  }
});

export default router;
