import { Router, Response } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const where: any = {};
  if (req.query.clientId) where.clientId = Number(req.query.clientId);
  if (req.query.taskId) where.taskId = Number(req.query.taskId);
  if (req.query.from && req.query.to) {
    where.startTime = { gte: new Date(req.query.from as string), lte: new Date(req.query.to as string) };
  }
  if (req.userRole !== 'admin') where.userId = req.userId;
  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      task: { select: { id: true, description: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'desc' },
  });
  res.json(entries);
});

router.post('/start', async (req: AuthRequest, res: Response) => {
  try {
    const activeEntry = await prisma.timeEntry.findFirst({
      where: { userId: req.userId!, endTime: null },
    });
    if (activeEntry) {
      res.status(400).json({ error: 'Ya tenés un timer activo', activeEntry });
      return;
    }
    const { clientId, description, taskId } = req.body;
    if (!clientId) {
      res.status(400).json({ error: 'Cliente requerido' });
      return;
    }
    const entry = await prisma.timeEntry.create({
      data: {
        startTime: new Date(),
        userId: req.userId!,
        clientId: Number(clientId),
        description,
        taskId: taskId ? Number(taskId) : null,
      },
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar timer' });
  }
});

router.post('/stop', async (req: AuthRequest, res: Response) => {
  try {
    const activeEntry = await prisma.timeEntry.findFirst({
      where: { userId: req.userId!, endTime: null },
    });
    if (!activeEntry) {
      res.status(404).json({ error: 'No hay timer activo' });
      return;
    }
    const now = new Date();
    const duration = Math.floor((now.getTime() - new Date(activeEntry.startTime).getTime()) / 1000);
    const entry = await prisma.timeEntry.update({
      where: { id: activeEntry.id },
      data: { endTime: now, duration },
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Error al detener timer' });
  }
});

router.get('/active', async (req: AuthRequest, res: Response) => {
  const entry = await prisma.timeEntry.findFirst({
    where: { userId: req.userId!, endTime: null },
    include: { client: { select: { id: true, name: true } } },
  });
  res.json(entry);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { description, startTime, endTime, duration } = req.body;
    const entry = await prisma.timeEntry.update({
      where: { id: Number(req.params.id) },
      data: { description, startTime, endTime, duration },
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar entrada' });
  }
});

export default router;
