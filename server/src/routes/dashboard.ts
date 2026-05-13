import { Router, Response } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const whereClause = req.userRole !== 'admin' ? { userId: req.userId! } : {};

    const [todayEntries, weekEntries, activeEntry, pendingTasks] = await Promise.all([
      prisma.timeEntry.findMany({
        where: { ...whereClause, startTime: { gte: today } },
        include: { client: { select: { id: true, name: true } } },
        orderBy: { startTime: 'desc' },
      }),
      prisma.timeEntry.findMany({
        where: { ...whereClause, startTime: { gte: weekStart } },
      }),
      prisma.timeEntry.findFirst({
        where: { userId: req.userId!, endTime: null },
        include: { client: { select: { id: true, name: true } } },
      }),
      prisma.task.findMany({
        where: { assignedTo: req.userId!, status: { in: ['pending', 'in_progress'] } },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const todayDuration = todayEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const weekDuration = weekEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

    res.json({
      todayEntries,
      todayDuration,
      weekDuration,
      activeEntry,
      pendingTasks,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
});

export default router;
