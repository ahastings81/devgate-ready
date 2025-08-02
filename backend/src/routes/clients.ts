// backend/src/routes/clients.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /clients
 * List all clients for the logged-in user, ordered by name.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  try {
    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch clients' });
  }
});

/**
 * POST /clients
 * Create a new client for the logged-in user.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const { name, contact } = req.body;
  try {
    const client = await prisma.client.create({
      data: {
        name,
        contact: contact || undefined,
        userId,
      },
    });
    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create client' });
  }
});

/**
 * PUT /clients/:id
 * Update an existing client (only if it belongs to the user).
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const id = Number(req.params.id);
  const { name, contact } = req.body;

  try {
    // Verify client belongs to this user
    const existing = await prisma.client.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        name,
        contact: contact || undefined,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update client' });
  }
});

/**
 * DELETE /clients/:id
 * Delete a client (only if it belongs to the user).
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const id = Number(req.params.id);

  try {
    const existing = await prisma.client.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await prisma.client.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete client' });
  }
});

export default router;
