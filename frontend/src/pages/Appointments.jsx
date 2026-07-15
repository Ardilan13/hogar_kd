import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, Plus, Trash2, Loader2, MapPin, Check, Pencil } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ImageUploadField from '../components/ImageUploadField';

export default function Appointments() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [form, setForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    location: '',
    notes: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  function load() {
    setLoading(true);
    api.get('/appointments').then(setItems).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
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
      const payload = { ...form, createdBy: user.name, done: false, imageUrl };
      const created = editingId ? await api.put(`/appointments/${editingId}`, payload) : await api.post('/appointments', payload);
      setItems((prev) => (editingId ? prev.map((i) => (i.id === editingId ? created : i)) : [created, ...prev]));
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({ title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', location: '', notes: '' });
    setImageFile(null);
    setRemoveImage(false);
    setCurrentImageUrl('');
    setEditingId(null);
    setOpen(false);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setCurrentImageUrl(item.imageUrl || '');
    setForm({ title: item.title || '', date: item.date || format(new Date(), 'yyyy-MM-dd'), time: item.time || '', location: item.location || '', notes: item.notes || '' });
    setImageFile(null);
    setRemoveImage(false);
    setOpen(true);
  }

  async function toggleDone(item) {
    const updated = await api.put(`/appointments/${item.id}`, { done: !item.done });
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  }

  async function remove(id) {
    if (!window.confirm('¿Borrar esta cita?')) return;
    await api.del(`/appointments/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const da = `${a.date} ${a.time || '00:00'}`;
        const db = `${b.date} ${b.time || '00:00'}`;
        return da.localeCompare(db);
      }),
    [items]
  );
  const pending = sorted.filter((i) => !i.done);
  const done = sorted.filter((i) => i.done);

  return (
    <div>
      <PageHeader
        eyebrow="Agenda"
        title="Citas y pendientes"
        description="Medico, tramites, planes... todo lo que tenga fecha"
        action={
          <button className="btn-primary" onClick={() => { resetForm(); setOpen(true); }}>
            <Plus size={18} /> Agregar cita
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16 text-ink/30">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No hay citas agendadas"
          description="Agreguen citas medicas, tramites o planes con fecha y hora."
          action={
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus size={18} /> Agregar cita
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="card divide-y divide-line">
            {pending.map((item) => (
              <AppointmentRow key={item.id} item={item} onToggle={toggleDone} onDelete={remove} onEdit={startEdit} />
            ))}
            {pending.length === 0 && (
              <p className="text-sm text-ink/45 text-center py-8">No hay pendientes. ¡Al dia! ✨</p>
            )}
          </div>
          {done.length > 0 && (
            <div>
              <p className="label mb-2 px-1">Completadas</p>
              <div className="card divide-y divide-line opacity-60">
                {done.map((item) => (
                  <AppointmentRow key={item.id} item={item} onToggle={toggleDone} onDelete={remove} onEdit={startEdit} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={open} onClose={resetForm} title={editingId ? 'Editar cita' : 'Agregar cita'}>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label" htmlFor="title">Titulo</label>
            <input
              id="title"
              className="input"
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej. Cita con el dentista"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="date">Fecha</label>
              <input
                id="date"
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="time">Hora (opcional)</label>
              <input
                id="time"
                type="time"
                className="input"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="location">Lugar (opcional)</label>
            <input
              id="location"
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Ej. Clinica, direccion..."
            />
          </div>
          <div>
            <label className="label" htmlFor="notes">Notas (opcional)</label>
            <input
              id="notes"
              className="input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <ImageUploadField
            label="Foto opcional"
            value={editingId ? currentImageUrl : ''}
            onChange={setImageFile}
            onRemove={() => setRemoveImage(true)}
          />
          <button type="submit" disabled={saving || !form.title.trim()} className="btn-primary w-full">
            {saving ? <Loader2 size={18} className="animate-spin" /> : editingId ? 'Guardar cambios' : 'Guardar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function AppointmentRow({ item, onToggle, onDelete, onEdit }) {
  const dateObj = parseISO(item.date);
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <button
        onClick={() => onToggle(item)}
        className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.done ? 'bg-sage border-sage text-white' : 'border-line hover:border-sage'
        }`}
        aria-label={item.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
      >
        {item.done && <Check size={14} />}
      </button>
      <div className="w-14 shrink-0 text-center">
        <p className="text-[10px] uppercase font-semibold text-berry-dark leading-none">
          {format(dateObj, 'MMM', { locale: es })}
        </p>
        <p className="font-display font-semibold text-lg leading-none mt-0.5">{format(dateObj, 'd')}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.done ? 'line-through text-ink/40' : ''}`}>
          {item.title}
        </p>
        <p className="text-xs text-ink/45 flex items-center gap-2 mt-0.5">
          {item.time && <span>{item.time}</span>}
          {item.location && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {item.location}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(item)} className="p-1.5 text-ink/30 hover:text-berry transition-colors" aria-label="Editar">
          <Pencil size={15} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 text-ink/30 hover:text-berry transition-colors"
          aria-label="Borrar"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
