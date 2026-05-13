import { Router, Response } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/client-login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.clientUser.findUnique({
      where: { email },
      include: { client: { select: { id: true, name: true } } },
    });
    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }
    const bcrypt = await import('bcryptjs');
    if (!(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
    const token = jwt.default.sign(
      { id: user.id, clientId: user.clientId, role: user.role, type: 'client' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, clientId: user.clientId, clientName: user.client.name },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const where: any = {};
  if (req.query.clientId) where.clientId = Number(req.query.clientId);
  if (req.query.status) where.status = req.query.status;
  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      sector: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tickets);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { subject, description, clientId, sectorId, createdBy } = req.body;
    if (!subject || !description || !clientId) {
      res.status(400).json({ error: 'Faltan campos requeridos' });
      return;
    }
    const ticket = await prisma.ticket.create({
      data: {
        subject,
        description,
        clientId: Number(clientId),
        sectorId: sectorId ? Number(sectorId) : null,
        createdBy: createdBy ? Number(createdBy) : req.userId!,
      },
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear ticket' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { status, assignedTo } = req.body;
    const data: any = {};
    if (status) data.status = status;
    if (assignedTo !== undefined) data.assignedTo = assignedTo ? Number(assignedTo) : null;
    const ticket = await prisma.ticket.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar ticket' });
  }
});

export default router;
