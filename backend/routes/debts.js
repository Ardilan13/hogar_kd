// Deudas del uno al otro (quien le debe a quien) + un resumen de balance neto
import { Router } from 'express';
import { createCrudRouter } from './crudFactory.js';
import { getCollection } from '../db.js';

const router = Router();

// Balance neto entre los dos, solo contando deudas no pagadas.
// Resultado: { [nombre]: numero } -> positivo = le deben, negativo = debe.
router.get('/summary/balance', (req, res) => {
  const debts = getCollection('debts').filter((d) => !d.paid);
  const balance = {};
  debts.forEach((d) => {
    const amount = Number(d.amount) || 0;
    balance[d.to] = (balance[d.to] || 0) + amount;
    balance[d.from] = (balance[d.from] || 0) - amount;
  });
  res.json(balance);
});

router.use('/', createCrudRouter('debts'));

export default router;
