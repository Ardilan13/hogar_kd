import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

import { getCollection, saveCollection } from './db.js';
import { requireAuth } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import shoppingRoutes from './routes/shopping.js';
import debtsRoutes from './routes/debts.js';
import wishlistRoutes from './routes/wishlist.js';
import eventsRoutes from './routes/events.js';
import appointmentsRoutes from './routes/appointments.js';
import notesRoutes from './routes/notes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  No definiste JWT_SECRET en tu .env. Usando uno temporal solo para pruebas.');
}

app.use(cors());
app.use(express.json());

// Crea los dos perfiles automaticamente la primera vez que se arranca el servidor
async function seedUsers() {
  const users = getCollection('users');
  if (users.length === 0) {
    const u1Name = process.env.USER1_NAME || 'Persona 1';
    const u1Pin = process.env.USER1_PIN || '1234';
    const u2Name = process.env.USER2_NAME || 'Persona 2';
    const u2Pin = process.env.USER2_PIN || '5678';

    const newUsers = [
      { id: nanoid(8), name: u1Name, pinHash: await bcrypt.hash(String(u1Pin), 10), avatar: '💜' },
      { id: nanoid(8), name: u2Name, pinHash: await bcrypt.hash(String(u2Pin), 10), avatar: '💙' }
    ];
    saveCollection('users', newUsers);
    console.log('👥 Perfiles creados automaticamente:');
    console.log(`   - ${u1Name} (PIN: ${u1Pin})`);
    console.log(`   - ${u2Name} (PIN: ${u2Pin})`);
    console.log('   Puedes cambiar estos nombres/PIN en el archivo .env y borrar backend/data/db.json para regenerarlos.');
  }
}
await seedUsers();

app.use('/api/auth', authRoutes);
app.use('/api/shopping', requireAuth, shoppingRoutes);
app.use('/api/debts', requireAuth, debtsRoutes);
app.use('/api/wishlist', requireAuth, wishlistRoutes);
app.use('/api/events', requireAuth, eventsRoutes);
app.use('/api/appointments', requireAuth, appointmentsRoutes);
app.use('/api/notes', requireAuth, notesRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Sirve el frontend ya compilado (npm run build en /frontend genera /frontend/dist)
// Esto permite desplegar backend + frontend como UNA sola app Node en Hostinger.
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
