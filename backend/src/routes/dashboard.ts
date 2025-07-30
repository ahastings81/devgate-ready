import { Router, Request, Response } from 'express';
import { PrismaClient }           from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /dashboard/metrics
 * Returns unbilled hours/amount, outstanding invoices/count & amount,
 * and revenue for the current month.
 */
router.get('/metrics', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  try {
    // 1️⃣ Unbilled time entries
    const entries = await prisma.timeEntry.findMany({
      where: { billed: false, project: { client: { userId } } },
      include: { project: true },
    });
    const unbilledHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const unbilledAmount = entries.reduce(
      (sum, e) => sum + e.hours * (e.project.rate ?? 0),
      0
    );

    // 2️⃣ Outstanding invoices (not “paid”)
    const invs = await prisma.invoice.findMany({
      where: { userId, status: { not: 'paid' } },
    });
    const outstandingInvoices = invs.length;
    const outstandingAmount = invs.reduce((sum, inv) => sum + inv.amount, 0);

    // 3️⃣ Revenue this month (only “paid” invoices)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthInvs = await prisma.invoice.findMany({
      where: {
        userId,
        status: 'paid',
        date: { gte: startOfMonth, lt: startOfNext },
      },
    });
    const revenueThisMonth = monthInvs.reduce((sum, inv) => sum + inv.amount, 0);

    res.json({
      unbilledHours,
      unbilledAmount,
      outstandingInvoices,
      outstandingAmount,
      revenueThisMonth,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load dashboard metrics' });
  }
});

export default router;
