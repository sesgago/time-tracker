import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/:clientId', async (req: AuthRequest, res: Response) => {
  const users = await prisma.clientUser.findMany({
    where: { clientId: Number(req.params.clientId) },
    include: { sector: { select: { id: true, name: true } } },
  });
  res.json(users);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, clientId, sectorId } = req.body;
    if (!name || !email || !password || !clientId) {
      res.status(400).json({ error: 'Faltan campos requeridos' });
      return;
    }
    const existing = await prisma.clientUser.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email ya registrado' });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.clientUser.create({
      data: {
        name,
        email,
        password: hashed,
        role: role || 'basic',
        clientId: Number(clientId),
        sectorId: sectorId ? Number(sectorId) : null,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario de cliente' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role, sectorId } = req.body;
    const data: any = { name, email, role };
    if (sectorId !== undefined) data.sectorId = sectorId ? Number(sectorId) : null;
    const user = await prisma.clientUser.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.clientUser.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

export default router;
