import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma.js';
import { sendVerificationEmail } from '../utils/email.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Faltan campos requeridos' });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email ya registrado' });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'tech', verifyToken },
    });
    await sendVerificationEmail(email, verifyToken);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email y password requeridos' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.get('/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Token requerido' });
      return;
    }
    const user = await prisma.user.findFirst({ where: { verifyToken: token } });
    if (!user) {
      res.status(404).json({ error: 'Token inválido' });
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { verified: true, verifyToken: null },
    });
    res.json({ message: 'Email verificado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, role: true, verified: true },
  });
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  res.json(user);
});

export default router;
