import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Trash2, Loader2, Check } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const CATEGORIES = ['Mercado', 'Aseo', 'Hogar', 'Otro'];

export default function Shopping() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: '', category: 'Mercado' });

  function load() {
    setLoading(true);
    api
      .get('/shopping')
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const created = await api.post('/shopping', { ...form, addedBy: user.name, bought: false });
      setItems((prev) => [created, ...prev]);
      setForm({ name: '', quantity: '', category: 'Mercado' });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleBought(item) {
    const updated = await api.put(`/shopping/${item.id}`, { bought: !item.bought });
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  }

  async function remove(id) {
    if (!window.confirm('¿Borrar este producto de la lista?')) return;
    await api.del(`/shopping/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const pending = items.filter((i) => !i.bought);
  const bought = items.filter((i) => i.bought);

  return (
    <div>
      <PageHeader
        eyebrow="Lista compartida"
        title="Mercado"
        description={`${pending.length} pendiente${pending.length === 1 ? '' : 's'} por comprar`}
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={18} /> Agregar
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16 text-ink/30">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="La lista esta vacia"
          description="Agrega lo que haga falta en casa y ambos lo veran aqui."
          action={
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus size={18} /> Agregar producto
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="card divide-y divide-line">
              {pending.map((item) => (
                <Row key={item.id} item={item} onToggle={toggleBought} onDelete={remove} />
              ))}
            </div>
          )}

          {bought.length > 0 && (
            <div>
              <p className="label mb-2 px-1">Ya comprado</p>
              <div className="card divide-y divide-line opacity-60">
                {bought.map((item) => (
                  <Row key={item.id} item={item} onToggle={toggleBought} onDelete={remove} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Agregar al mercado">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">Producto</label>
            <input
              id="name"
              className="input"
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Leche, papel higienico..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="quantity">Cantidad</label>
              <input
                id="quantity"
                className="input"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="Ej. 2 litros"
              />
            </div>
            <div>
              <label className="label" htmlFor="category">Categoria</label>
              <select
                id="category"
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving || !form.name.trim()} className="btn-primary w-full">
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Agregar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function Row({ item, onToggle, onDelete }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={() => onToggle(item)}
        className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.bought ? 'bg-sage border-sage text-white' : 'border-line hover:border-sage'
        }`}
        aria-label={item.bought ? 'Marcar como pendiente' : 'Marcar como comprado'}
      >
        {item.bought && <Check size={14} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.bought ? 'line-through text-ink/40' : ''}`}>
          {item.name}
        </p>
        <p className="text-xs text-ink/45">
          {[item.quantity, item.category].filter(Boolean).join(' · ')} {item.addedBy ? `· agregado por ${item.addedBy}` : ''}
        </p>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="p-1.5 text-ink/30 hover:text-berry transition-colors"
        aria-label="Borrar"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
