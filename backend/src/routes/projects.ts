// backend/src/routes/projects.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /projects
 * List all projects (active & completed) for the logged-in user,
 * ordered by completed flag (active first) then by dueDate ascending.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  try {
    const projects = await prisma.project.findMany({
      where: {
        client: { is: { userId } }
      },
      include: { client: true },
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' }
      ],
    });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch projects' });
  }
});

/**
 * POST /projects
 * Create a new project under an existing client.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const { title, description, rate, dueDate, clientId } = req.body;

  try {
    const client = await prisma.client.findFirst({
      where: { id: Number(clientId), userId }
    });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description: description || undefined,
        rate: rate != null ? Number(rate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        client: { connect: { id: client.id } }
      },
      include: { client: true }
    });
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create project' });
  }
});

/**
 * PUT /projects/:id
 * Update an existing project (only if it belongs to the user).
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const id = Number(req.params.id);
  const { title, description, rate, dueDate, clientId } = req.body;

  try {
    const existing = await prisma.project.findFirst({
      where: {
        id,
        client: { is: { userId } }
      }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const data: any = {
      title,
      description: description || undefined,
      rate: rate != null ? Number(rate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    };
    if (clientId != null) {
      data.clientId = Number(clientId);
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
      include: { client: true }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update project' });
  }
});

/**
 * PATCH /projects/:id/complete
 * Mark a project as completed.
 */
router.patch('/:id/complete', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const id = Number(req.params.id);

  try {
    const existing = await prisma.project.findFirst({
      where: {
        id,
        client: { is: { userId } }
      }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        completed: true,
        completedAt: new Date()
      },
      include: { client: true }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not complete project' });
  }
});

/**
 * PATCH /projects/:id/reactivate
 * Unmark a project as completed.
 */
router.patch('/:id/reactivate', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const id = Number(req.params.id);

  try {
    const existing = await prisma.project.findFirst({
      where: {
        id,
        client: { is: { userId } }
      }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        completed: false,
        completedAt: null
      },
      include: { client: true }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not reactivate project' });
  }
});

/**
 * DELETE /projects/:id
 * Delete a project (only if it belongs to the user).
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const id = Number(req.params.id);

  try {
    const existing = await prisma.project.findFirst({
      where: {
        id,
        client: { is: { userId } }
      }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete project' });
  }
});

export default router;
