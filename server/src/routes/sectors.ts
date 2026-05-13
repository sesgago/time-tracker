import { Router, Response } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/:clientId', async (req: AuthRequest, res: Response) => {
  const sectors = await prisma.sector.findMany({
    where: { clientId: Number(req.params.clientId) },
  });
  res.json(sectors);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, clientId } = req.body;
    if (!name || !clientId) {
      res.status(400).json({ error: 'Nombre y clientId requeridos' });
      return;
    }
    const sector = await prisma.sector.create({
      data: { name, clientId: Number(clientId) },
    });
    res.status(201).json(sector);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear sector' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const sector = await prisma.sector.update({
      where: { id: Number(req.params.id) },
      data: { name },
    });
    res.json(sector);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar sector' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.sector.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Sector eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar sector' });
  }
});

export default router;
