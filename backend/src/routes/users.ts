// backend/src/routes/users.ts

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { requireAuth, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// — GET /users/me — return id, email, profilePic
router.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response) => {
    // cast to AuthRequest so TS knows about userId
    const authReq = req as AuthRequest;
    try {
      const user = await prisma.user.findUnique({
        where: { id: authReq.userId },
        select: { id: true, email: true, profilePic: true }
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Could not load profile' });
    }
  }
);

// set up multer to save uploads/avatars/user-<id>.ext
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const authReq = req as AuthRequest;
    const ext = path.extname(file.originalname);
    cb(null, `user-${authReq.userId}${ext}`);
  }
});
const upload = multer({ storage });

// — POST /users/avatar — accept single 'avatar' file
router.post(
  '/avatar',
  requireAuth,
  upload.single('avatar'),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest & { file?: Express.Multer.File };
    if (!authReq.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // store relative URL path in DB
    const relPath = `/uploads/avatars/${authReq.file.filename}`;
    try {
      const user = await prisma.user.update({
        where: { id: authReq.userId },
        data: { profilePic: relPath },
        select: { id: true, email: true, profilePic: true }
      });
      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Could not save avatar' });
    }
  }
);

export default router;
