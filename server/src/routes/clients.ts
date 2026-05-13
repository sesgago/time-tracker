import { Router, Response } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const clients = await prisma.client.findMany({
    include: { _count: { select: { sectors: true, users: true, tasks: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(clients);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findUnique({
    where: { id: Number(req.params.id) },
    include: { sectors: true, users: true, tasks: { include: { assigned: { select: { id: true, name: true } } } } },
  });
  if (!client) {
    res.status(404).json({ error: 'Cliente no encontrado' });
    return;
  }
  res.json(client);
});

router.post('/', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, notes } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Nombre requerido' });
      return;
    }
    const client = await prisma.client.create({
      data: { name, phone, notes, createdBy: req.userId! },
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

router.put('/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, notes } = req.body;
    const client = await prisma.client.update({
      where: { id: Number(req.params.id) },
      data: { name, phone, notes },
    });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.client.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

export default router;
