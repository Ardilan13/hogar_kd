import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  addYears,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  setYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarHeart, ChevronLeft, ChevronRight, Plus, Trash2, Loader2, Repeat, Pencil } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ImageUploadField from '../components/ImageUploadField';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function getNextOccurrence(event) {
  const base = parseISO(event.date);
  if (!event.recurringYearly) return base;
  const today = startOfDay(new Date());
  let next = setYear(base, today.getFullYear());
  if (isBefore(next, today) && !isSameDay(next, today)) {
    next = addYears(next, 1);
  }
  return next;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [form, setForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    recurringYearly: true,
    notes: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  function load() {
    setLoading(true);
    api.get('/events').then(setEvents).finally(() => setLoading(false));
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
      const payload = { ...form, createdBy: user.name, imageUrl };
      const created = editingId ? await api.put(`/events/${editingId}`, payload) : await api.post('/events', payload);
      setEvents((prev) => (editingId ? prev.map((e) => (e.id === editingId ? created : e)) : [created, ...prev]));
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({ title: '', date: format(new Date(), 'yyyy-MM-dd'), recurringYearly: true, notes: '' });
    setImageFile(null);
    setRemoveImage(false);
    setCurrentImageUrl('');
    setEditingId(null);
    setOpen(false);
  }

  function startEdit(event) {
    setEditingId(event.id);
    setCurrentImageUrl(event.imageUrl || '');
    setForm({ title: event.title || '', date: event.date || format(new Date(), 'yyyy-MM-dd'), recurringYearly: Boolean(event.recurringYearly), notes: event.notes || '' });
    setImageFile(null);
    setRemoveImage(false);
    setOpen(true);
  }

  async function remove(id) {
    if (!window.confirm('¿Borrar esta fecha?')) return;
    await api.del(`/events/${id}`);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function eventsOnDay(day) {
    return events.filter((ev) => {
      const evDate = parseISO(ev.date);
      if (ev.recurringYearly) {
        return evDate.getDate() === day.getDate() && evDate.getMonth() === day.getMonth();
      }
      return isSameDay(evDate, day);
    });
  }

  const upcoming = useMemo(() => {
    return [...events]
      .map((ev) => ({ ...ev, next: getNextOccurrence(ev) }))
      .sort((a, b) => a.next - b.next);
  }, [events]);

  function openOnDay(day) {
    setForm((f) => ({ ...f, date: format(day, 'yyyy-MM-dd') }));
    setOpen(true);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Que no se les olvide"
        title="Fechas especiales"
        description="Aniversarios, cumpleanos y cualquier fecha que quieran celebrar"
        action={
          <button className="btn-primary" onClick={() => { resetForm(); setOpen(true); }}>
            <Plus size={18} /> Agregar fecha
          </button>
        }
      />

      <div className="card p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-blush transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="font-display font-semibold capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </p>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-blush transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-ink/40 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEvents = eventsOnDay(day);
            const inMonth = isSameMonth(day, currentMonth);
            return (
              <button
                key={day.toISOString()}
                onClick={() => openOnDay(day)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-colors ${
                  inMonth ? 'hover:bg-blush' : 'text-ink/25 hover:bg-blush/50'
                } ${isToday(day) ? 'bg-berry text-white hover:bg-berry-dark font-semibold' : ''}`}
              >
                {format(day, 'd')}
                {dayEvents.length > 0 && (
                  <span
                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                      isToday(day) ? 'bg-white' : 'bg-berry'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-ink/30">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarHeart}
          title="No hay fechas guardadas"
          description="Agreguen su aniversario, cumpleanos, o cualquier fecha importante para los dos."
        />
      ) : (
        <div>
          <p className="label mb-2 px-1">Proximas fechas</p>
          <div className="card divide-y divide-line">
            {upcoming.map((ev) => {
              const days = differenceInCalendarDays(startOfDay(ev.next), startOfDay(new Date()));
              return (
                <div key={ev.id} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blush flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-semibold text-berry-dark leading-none">
                      {format(ev.next, 'MMM', { locale: es })}
                    </span>
                    <span className="font-display font-semibold text-lg leading-none mt-0.5">
                      {format(ev.next, 'd')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      {ev.title}
                      {ev.recurringYearly && <Repeat size={12} className="text-ink/30" />}
                    </p>
                    {ev.notes && <p className="text-xs text-ink/50 mt-0.5">{ev.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-berry-dark">
                      {days === 0 ? '¡Es hoy!' : days > 0 ? `en ${days} dias` : `hace ${Math.abs(days)} dias`}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <button onClick={() => startEdit(ev)} className="text-ink/25 hover:text-berry transition-colors" aria-label="Editar">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => remove(ev.id)}
                        className="text-ink/25 hover:text-berry transition-colors"
                        aria-label="Borrar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={open} onClose={resetForm} title={editingId ? 'Editar fecha' : 'Agregar fecha especial'}>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label" htmlFor="title">Titulo</label>
            <input
              id="title"
              className="input"
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej. Aniversario, cumpleanos de..."
            />
          </div>
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="rounded accent-berry"
              checked={form.recurringYearly}
              onChange={(e) => setForm({ ...form, recurringYearly: e.target.checked })}
            />
            Se repite cada año
          </label>
          <div>
            <label className="label" htmlFor="notes">Notas (opcional)</label>
            <input
              id="notes"
              className="input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ideas de regalo, plan, etc."
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
