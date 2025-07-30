import { Router, Request, Response } from 'express';
import { PrismaClient }           from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /services
 * List all services for the current user
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  try {
    const services = await prisma.service.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch services' });
  }
});

/**
 * POST /services
 * Create a new service for the current user
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const { name, description, fee } = req.body;
  try {
    const svc = await prisma.service.create({
      data: {
        userId,
        name,
        description: description || undefined,
        fee: Number(fee),
      }
    });
    res.status(201).json(svc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create service' });
  }
});

/**
 * PUT /services/:id
 * Update an existing service
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const id = Number(req.params.id);
  const { name, description, fee } = req.body;
  try {
    const updated = await prisma.service.updateMany({
      where: { id, userId },
      data: {
        name,
        description: description || undefined,
        fee: Number(fee),
      }
    });
    if (updated.count === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    const svc = await prisma.service.findUnique({ where: { id } });
    res.json(svc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update service' });
  }
});

/**
 * DELETE /services/:id
 * Delete a service
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const id = Number(req.params.id);
  try {
    await prisma.service.deleteMany({ where: { id, userId } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete service' });
  }
});

export default router;
