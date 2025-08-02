// backend/src/routes/metrics.ts
import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = Router();

// GET /metrics
router.get('/', requireAuth, async (req, res: Response) => {
  const { userId } = req as AuthRequest;
  try {
    // total time this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const hoursThisWeek = await prisma.timeEntry.aggregate({
      _sum: { hours: true },
      where: { userId, date: { gte: weekAgo } }
    });

    // pending invoices
    const pendingInvoices = await prisma.invoice.count({
      where: { userId, status: 'PENDING' }
    });

    // upcoming deadlines
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);
    const upcoming = await prisma.project.count({
      where: {
        client: { userId },
        completed: false,
        dueDate: { gte: now, lte: in7Days }
      }
    });

    res.json({
      hoursThisWeek: hoursThisWeek._sum.hours || 0,
      pendingInvoices,
      upcomingDeadlines: upcoming
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load metrics' });
  }
});

export default router;
