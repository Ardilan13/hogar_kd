import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { StickyNote, Plus, Trash2, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const COLORS = ['#F1E4E6', '#E0AC5F', '#9AB89F', '#FBF8F3'];
const ROTATIONS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2'];

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const created = await api.post('/notes', { message, from: user.name, color });
      setNotes((prev) => [created, ...prev]);
      setMessage('');
      setOpen(false);
    } finally {
      setSaving(false);
    }
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
          <button className="btn-primary" onClick={() => setOpen(true)}>
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
              <button
                onClick={() => remove(note.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-ink/40 hover:text-berry"
                aria-label="Borrar"
              >
                <Trash2 size={14} />
              </button>
              <p className="pr-4 break-words">{note.message}</p>
              <p className="text-xs font-sans text-ink/50 mt-3">
                — {note.from}, {format(parseISO(note.createdAt), "d 'de' MMM", { locale: es })}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Dejar una notita">
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
          <button type="submit" disabled={saving || !message.trim()} className="btn-primary w-full">
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Dejar notita'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
