import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getCollection } from '../db.js';

const router = Router();

// Lista de perfiles disponibles (sin datos sensibles) para mostrar en la pantalla de login
router.get('/profiles', (req, res) => {
  const users = getCollection('users');
  res.json(users.map((u) => ({ id: u.id, name: u.name, avatar: u.avatar })));
});

router.post('/login', async (req, res) => {
  const { userId, pin } = req.body;
  if (!userId || !pin) {
    return res.status(400).json({ error: 'Selecciona un perfil e ingresa el PIN' });
  }
  const users = getCollection('users');
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(401).json({ error: 'Perfil no encontrado' });

  const valid = await bcrypt.compare(String(pin), user.pinHash);
  if (!valid) return res.status(401).json({ error: 'PIN incorrecto' });

  const token = jwt.sign(
    { id: user.id, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  res.json({ token, user: { id: user.id, name: user.name, avatar: user.avatar } });
});

export default router;
