import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { StickyNote, Plus, Trash2, Loader2, Pencil } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ImageUploadField from '../components/ImageUploadField';

const COLORS = ['#F1E4E6', '#E0AC5F', '#9AB89F', '#FBF8F3'];
const ROTATIONS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2'];

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  function load() {
    setLoading(true);
    api.get('/notes').then(setNotes).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSaving(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const data = await api.postForm('/media/upload', formData, { auth: true });
        imageUrl = data.url;
      } else if (editingId && currentImageUrl && !removeImage) {
        imageUrl = currentImageUrl;
      }
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const payload = { message, from: user.name, color, imageUrl };
      const created = editingId ? await api.put(`/notes/${editingId}`, payload) : await api.post('/notes', payload);
      setNotes((prev) => (editingId ? prev.map((n) => (n.id === editingId ? created : n)) : [created, ...prev]));
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setMessage('');
    setImageFile(null);
    setRemoveImage(false);
    setCurrentImageUrl('');
    setEditingId(null);
    setOpen(false);
  }

  function startEdit(note) {
    setEditingId(note.id);
    setCurrentImageUrl(note.imageUrl || '');
    setMessage(note.message || '');
    setImageFile(null);
    setRemoveImage(false);
    setOpen(true);
  }

  async function remove(id) {
    if (!window.confirm('¿Borrar esta notita?')) return;
    await api.del(`/notes/${id}`);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Mensajitos"
        title="Notitas"
        description="Cositas cortas que se quieran decir, como post-its"
        action={
          <button className="btn-primary" onClick={() => { resetForm(); setOpen(true); }}>
            <Plus size={18} /> Dejar notita
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16 text-ink/30">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="Aun no hay notitas"
          description="Dejense un mensaje cortito. Se guarda aqui como si fuera un post-it."
          action={
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus size={18} /> Dejar notita
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 pt-2">
          {notes.map((note, i) => (
            <div
              key={note.id}
              className={`sticky-note group relative ${ROTATIONS[i % ROTATIONS.length]} hover:rotate-0 transition-transform`}
              style={{ backgroundColor: note.color || COLORS[i % COLORS.length] }}
            >
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(note)} className="text-ink/40 hover:text-berry" aria-label="Editar">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => remove(note.id)}
                  className="text-ink/40 hover:text-berry"
                  aria-label="Borrar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {note.imageUrl && <img src={note.imageUrl} alt="Foto de la nota" className="mb-3 h-28 w-full rounded-md object-cover" />}
              <p className="pr-4 break-words">{note.message}</p>
              <p className="text-xs font-sans text-ink/50 mt-3">
                — {note.from}, {format(parseISO(note.createdAt), "d 'de' MMM", { locale: es })}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={resetForm} title={editingId ? 'Editar notita' : 'Dejar una notita'}>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label" htmlFor="message">Mensaje</label>
            <textarea
              id="message"
              rows={4}
              autoFocus
              className="input font-hand text-lg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe algo lindo..."
            />
          </div>
          <ImageUploadField
            label="Foto opcional"
            value={editingId ? currentImageUrl : ''}
            onChange={setImageFile}
            onRemove={() => setRemoveImage(true)}
          />
          <button type="submit" disabled={saving || !message.trim()} className="btn-primary w-full">
            {saving ? <Loader2 size={18} className="animate-spin" /> : editingId ? 'Guardar cambios' : 'Dejar notita'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
