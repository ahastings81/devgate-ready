// backend/src/routes/timeEntries.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /time-entries
 * List all time entries for the logged-in user, newest first.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  try {
    const entries = await prisma.timeEntry.findMany({
      where: {
        project: {
          is: {
            client: { is: { userId } }
          }
        }
      },
      include: {
        project: {
          include: { client: true }
        }
      },
      orderBy: { date: 'desc' },
    });
    return res.json(entries);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not fetch time entries' });
  }
});

/**
 * POST /time-entries
 * Create a new time entry under a project owned by this user.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const { projectId, date, hours, description } = req.body;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: Number(projectId),
        client: { is: { userId } }
      }
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        date: new Date(date),
        hours: Number(hours),
        description,
        project: { connect: { id: project.id } }
      },
      include: {
        project: { include: { client: true } }
      }
    });
    return res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not create time entry' });
  }
});

/**
 * DELETE /time-entries/:id
 * Delete a time entry if it belongs to this user.
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest;
  const id = Number(req.params.id);

  try {
    const existing = await prisma.timeEntry.findFirst({
      where: {
        id,
        project: {
          is: {
            client: { is: { userId } }
          }
        }
      }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    await prisma.timeEntry.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not delete entry' });
  }
});

export default router;
