import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /dashboard
 * Returns your key metrics:
 * - unbilledHours: sum of hours on un-billed time entries
 * - unbilledAmount: sum of (hours * project.rate) for those entries
 * - outstandingInvoices: count of invoices not yet paid
 * - outstandingAmount: sum of invoice.amount for those unpaid
 * - revenueThisMonth: sum of invoice.amount with date in the current calendar month
 */
router.get('/', requireAuth, async (req, res) => {
  const { userId } = req as AuthRequest;

  try {
    // unbilled time entries
    const unbilledEntries = await prisma.timeEntry.findMany({
      where: { billed: false, project: { client: { userId } } },
      include: { project: true }
    });
    const unbilledHours = unbilledEntries.reduce((sum, e) => sum + e.hours, 0);
    const unbilledAmount = unbilledEntries.reduce((sum, e) => sum + e.hours * (e.project.rate || 0), 0);

    // outstanding invoices
    const outstandingInvoices = await prisma.invoice.count({
      where: { status: { not: 'PAID' }, userId }
    });
    const outstandingAmount = await prisma.invoice.aggregate({
      where: { status: { not: 'PAID' }, userId },
      _sum: { amount: true }
    }).then(r => r._sum.amount || 0);

    // revenue this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth()+1);

    const revenueThisMonth = await prisma.invoice.aggregate({
      where: {
        userId,
        date: { gte: startOfMonth, lt: endOfMonth },
        status: 'PAID'
      },
      _sum: { amount: true }
    }).then(r => r._sum.amount || 0);

    res.json({
      unbilledHours,
      unbilledAmount,
      outstandingInvoices,
      outstandingAmount,
      revenueThisMonth
    });
  } catch (err) {
    console.error('Error fetching dashboard metrics', err);
    res.status(500).json({ error: 'Could not load dashboard metrics' });
  }
});

export default router;
