import { Router, Response } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const where: any = {};
  if (req.query.clientId) where.clientId = Number(req.query.clientId);
  if (req.query.status) where.status = req.query.status;
  if (req.userRole !== 'admin') where.assignedTo = req.userId;
  const tasks = await prisma.task.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      assigned: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tasks);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { description, priority, clientId, assignedTo } = req.body;
    if (!description || !clientId) {
      res.status(400).json({ error: 'Descripción y cliente requeridos' });
      return;
    }
    const task = await prisma.task.create({
      data: {
        description,
        priority: priority || 'medium',
        clientId: Number(clientId),
        assignedTo: assignedTo ? Number(assignedTo) : req.userId!,
        createdBy: req.userId!,
      },
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { description, status, priority } = req.body;
    const task = await prisma.task.update({
      where: { id: Number(req.params.id) },
      data: { description, status, priority },
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.task.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
});

export default router;
