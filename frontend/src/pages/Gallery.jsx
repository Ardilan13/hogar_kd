import { useEffect, useState } from 'react';
import { Image, Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ImageUploadField from '../components/ImageUploadField';

export default function Gallery() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [imageFile, setImageFile] = useState(null);

  function load() {
    setLoading(true);
    api.get('/gallery').then(setItems).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!imageFile && !form.title.trim()) return;
    setSaving(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const data = await api.postForm('/media/upload', formData, { auth: true });
        imageUrl = data.url;
      }
      const created = await api.post('/gallery', {
        title: form.title,
        description: form.description,
        imageUrl,
        createdBy: user?.name || 'Tú'
      });
      setItems((prev) => [created, ...prev]);
      setForm({ title: '', description: '' });
      setImageFile(null);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('¿Borrar esta foto de la galería?')) return;
    await api.del(`/gallery/${id}`);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Recuerdos"
        title="Galería"
        description="Sube fotos bonitas, momentos y detalles de la vida en pareja"
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={18} /> Agregar foto
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16 text-ink/30">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Image}
          title="Todavía no hay fotos"
          description="Guarda aquí recuerdos, fotos del hogar o detalles especiales."
          action={
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus size={18} /> Agregar foto
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="card overflow-hidden">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.title || 'Foto'} className="h-48 w-full object-cover" /> : <div className="h-48 bg-blush" />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-semibold text-lg">{item.title || 'Foto'}</p>
                    {item.description && <p className="text-sm text-ink/60 mt-1">{item.description}</p>}
                  </div>
                  <button onClick={() => remove(item.id)} className="text-ink/30 hover:text-berry transition-colors" aria-label="Borrar">
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="text-xs text-ink/45 mt-3">Por {item.createdBy || 'alguien'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Agregar foto a la galería">
        <form onSubmit={handleAdd} className="space-y-4">
          <ImageUploadField label="Foto" onChange={setImageFile} />
          <div>
            <label className="label" htmlFor="title">Titulo (opcional)</label>
            <input id="title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej. Noche de cine" />
          </div>
          <div>
            <label className="label" htmlFor="description">Descripción (opcional)</label>
            <textarea id="description" rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Algo bonito para recordar" />
          </div>
          <button type="submit" disabled={saving || (!imageFile && !form.title.trim())} className="btn-primary w-full">
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Guardar foto'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
