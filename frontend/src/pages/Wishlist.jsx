import { useEffect, useState } from 'react';
import { Gift, Plus, Trash2, Loader2, ExternalLink, Sparkles, Pencil } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ImageUploadField from '../components/ImageUploadField';
import { formatCurrency } from '../utils/format';

const PRIORITIES = {
  alta: { label: 'Alta', className: 'bg-berry/10 text-berry-dark' },
  media: { label: 'Media', className: 'bg-honey/15 text-honey' },
  baja: { label: 'Baja', className: 'bg-sage/15 text-sage-dark' }
};

export default function Wishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', link: '', priority: 'media' });
  const [imageFile, setImageFile] = useState(null);

  function load() {
    setLoading(true);
    api.get('/wishlist').then(setItems).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const data = await api.postForm('/media/upload', formData, { auth: true });
        imageUrl = data.url;
      }
      const payload = { ...form, wantedBy: user.name, achieved: false, imageUrl };
      const created = editingId ? await api.put(`/wishlist/${editingId}`, payload) : await api.post('/wishlist', payload);
      setItems((prev) => (editingId ? prev.map((i) => (i.id === editingId ? created : i)) : [created, ...prev]));
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({ name: '', price: '', link: '', priority: 'media' });
    setImageFile(null);
    setEditingId(null);
    setOpen(false);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({ name: item.name || '', price: item.price || '', link: item.link || '', priority: item.priority || 'media' });
    setImageFile(null);
    setOpen(true);
  }

  async function toggleAchieved(item) {
    const updated = await api.put(`/wishlist/${item.id}`, { achieved: !item.achieved });
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  }

  async function remove(id) {
    if (!window.confirm('¿Borrar este deseo?')) return;
    await api.del(`/wishlist/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const pending = items.filter((i) => !i.achieved);
  const achieved = items.filter((i) => i.achieved);

  return (
    <div>
      <PageHeader
        eyebrow="Para el futuro"
        title="Deseos"
        description="Cosas que quieren comprarse o cumplir juntos"
        action={
          <button className="btn-primary" onClick={() => { resetForm(); setOpen(true); }}>
            <Plus size={18} /> Agregar deseo
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16 text-ink/30">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Aun no hay deseos guardados"
          description="Guarden aqui lo que sueñan comprarse: un viaje, algo para la casa, lo que sea."
          action={
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus size={18} /> Agregar deseo
            </button>
          }
        />
      ) : (
        <div className="space-y-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map((item) => (
              <WishCard key={item.id} item={item} onToggle={toggleAchieved} onDelete={remove} onEdit={startEdit} />
            ))}
          </div>
          {achieved.length > 0 && (
            <div>
              <p className="label mb-2 px-1 flex items-center gap-1.5">
                <Sparkles size={13} /> Cumplidos
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {achieved.map((item) => (
                  <WishCard key={item.id} item={item} onToggle={toggleAchieved} onDelete={remove} onEdit={startEdit} muted />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={open} onClose={resetForm} title={editingId ? 'Editar deseo' : 'Agregar deseo'}>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">¿Que quieren?</label>
            <input
              id="name"
              className="input"
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Viaje a Cartagena"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="price">Precio estimado</label>
              <input
                id="price"
                type="number"
                min="0"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="label" htmlFor="priority">Prioridad</label>
              <select
                id="priority"
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="link">Enlace (opcional)</label>
            <input
              id="link"
              className="input"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <ImageUploadField label="Foto opcional" onChange={setImageFile} />
          <button type="submit" disabled={saving || !form.name.trim()} className="btn-primary w-full">
            {saving ? <Loader2 size={18} className="animate-spin" /> : editingId ? 'Guardar cambios' : 'Agregar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function WishCard({ item, onToggle, onDelete, onEdit, muted }) {
  const priority = PRIORITIES[item.priority] || PRIORITIES.media;
  return (
    <div className={`card p-4 flex flex-col ${muted ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priority.className}`}>
          {priority.label}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(item)} className="text-ink/25 hover:text-berry transition-colors" aria-label="Editar">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(item.id)} className="text-ink/25 hover:text-berry transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="mt-3 h-32 w-full rounded-lg object-cover" />}
      <p className={`font-display font-semibold text-lg mt-2 ${item.achieved ? 'line-through' : ''}`}>
        {item.name}
      </p>
      {item.price && <p className="text-sm text-ink/55 mt-0.5">{formatCurrency(item.price)}</p>}
      <div className="mt-auto pt-3 flex items-center justify-between">
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-berry-dark flex items-center gap-1 hover:underline"
          >
            Ver enlace <ExternalLink size={12} />
          </a>
        ) : (
          <span className="text-xs text-ink/40">{item.wantedBy}</span>
        )}
        <button
          onClick={() => onToggle(item)}
          className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
            item.achieved ? 'bg-sage/15 text-sage-dark' : 'bg-blush text-berry-dark hover:bg-berry/20'
          }`}
        >
          {item.achieved ? 'Cumplido ✓' : 'Marcar cumplido'}
        </button>
      </div>
    </div>
  );
}
