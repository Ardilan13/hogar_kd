// Fabrica de rutas CRUD reutilizable. Cada modulo (mercado, deseos, calendario,
// citas, notas) usa esto para no repetir el mismo codigo de listar/crear/editar/borrar.
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { getCollection, saveCollection } from '../db.js';

export function createCrudRouter(collectionName) {
  const router = Router();

  // Listar todo, mas reciente primero
  router.get('/', (req, res) => {
    const items = getCollection(collectionName);
    const sorted = [...items].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json(sorted);
  });

  // Crear
  router.post('/', (req, res) => {
    const items = getCollection(collectionName);
    const newItem = {
      id: nanoid(10),
      createdAt: new Date().toISOString(),
      ...req.body
    };
    items.push(newItem);
    saveCollection(collectionName, items);
    res.status(201).json(newItem);
  });

  // Editar (tambien sirve para marcar como comprado/pagado/hecho)
  router.put('/:id', (req, res) => {
    const items = getCollection(collectionName);
    const idx = items.findIndex((i) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
    items[idx] = { ...items[idx], ...req.body, id: items[idx].id, updatedAt: new Date().toISOString() };
    saveCollection(collectionName, items);
    res.json(items[idx]);
  });

  // Borrar
  router.delete('/:id', (req, res) => {
    const items = getCollection(collectionName);
    const filtered = items.filter((i) => i.id !== req.params.id);
    if (filtered.length === items.length) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    saveCollection(collectionName, filtered);
    res.json({ ok: true });
  });

  return router;
}
