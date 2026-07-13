import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addYears, differenceInCalendarDays, isBefore, isSameDay, parseISO, setYear, startOfDay } from 'date-fns';
import {
  ShoppingCart,
  Coins,
  Gift,
  CalendarHeart,
  CalendarClock,
  StickyNote,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';

function getNextOccurrence(event) {
  const base = parseISO(event.date);
  if (!event.recurringYearly) return base;
  const today = startOfDay(new Date());
  let next = setYear(base, today.getFullYear());
  if (isBefore(next, today) && !isSameDay(next, today)) next = addYears(next, 1);
  return next;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ shopping: [], debts: {}, events: [], appointments: [], notes: [] });

  useEffect(() => {
    Promise.all([
      api.get('/shopping'),
      api.get('/debts/summary/balance'),
      api.get('/events'),
      api.get('/appointments'),
      api.get('/notes')
    ])
      .then(([shopping, debts, events, appointments, notes]) => {
        setData({ shopping, debts, events, appointments, notes });
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingShopping = data.shopping.filter((s) => !s.bought);
  const pendingAppointments = useMemo(
    () =>
      [...data.appointments]
        .filter((a) => !a.done)
        .sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`)),
    [data.appointments]
  );
  const nextAppointment = pendingAppointments[0];

  const nextEvent = useMemo(() => {
    if (data.events.length === 0) return null;
    return [...data.events]
      .map((e) => ({ ...e, next: getNextOccurrence(e) }))
      .sort((a, b) => a.next - b.next)[0];
  }, [data.events]);

  const balanceEntries = Object.entries(data.debts).filter(([, v]) => v !== 0);
  const latestNote = data.notes[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos dias' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-ink/30">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-berry mb-1">
          {greeting}
        </p>
        <h1 className="font-display font-semibold text-2xl sm:text-3xl">
          Hola, {user?.name} {user?.avatar}
        </h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Proxima fecha especial */}
        <Link to="/calendario" className="card p-5 hover:shadow-lift transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blush text-berry flex items-center justify-center">
              <CalendarHeart size={17} />
            </div>
            <ArrowRight size={15} className="text-ink/20 group-hover:text-berry transition-colors" />
          </div>
          <p className="label mb-0.5">Proxima fecha</p>
          {nextEvent ? (
            <>
              <p className="font-display font-semibold text-lg">{nextEvent.title}</p>
              <p className="text-sm text-berry-dark font-medium mt-0.5">
                {differenceInCalendarDays(startOfDay(nextEvent.next), startOfDay(new Date())) === 0
                  ? 'Es hoy'
                  : `en ${differenceInCalendarDays(startOfDay(nextEvent.next), startOfDay(new Date()))} dias`}
              </p>
            </>
          ) : (
            <p className="text-sm text-ink/45">No hay fechas guardadas</p>
          )}
        </Link>

        {/* Balance de deudas */}
        <Link to="/deudas" className="card p-5 hover:shadow-lift transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blush text-berry flex items-center justify-center">
              <Coins size={17} />
            </div>
            <ArrowRight size={15} className="text-ink/20 group-hover:text-berry transition-colors" />
          </div>
          <p className="label mb-0.5">Deudas</p>
          {balanceEntries.length === 0 ? (
            <p className="font-display font-semibold text-lg">Paz y salvo 🎉</p>
          ) : (
            balanceEntries
              .filter(([, v]) => v < 0)
              .map(([name, v]) => (
                <p key={name} className="text-sm">
                  <span className="font-medium">{name}</span> debe{' '}
                  <span className="font-semibold text-berry-dark">{formatCurrency(Math.abs(v))}</span>
                </p>
              ))
          )}
        </Link>

        {/* Mercado pendiente */}
        <Link to="/mercado" className="card p-5 hover:shadow-lift transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blush text-berry flex items-center justify-center">
              <ShoppingCart size={17} />
            </div>
            <ArrowRight size={15} className="text-ink/20 group-hover:text-berry transition-colors" />
          </div>
          <p className="label mb-0.5">Mercado</p>
          <p className="font-display font-semibold text-lg">
            {pendingShopping.length} pendiente{pendingShopping.length === 1 ? '' : 's'}
          </p>
          {pendingShopping[0] && (
            <p className="text-sm text-ink/50 mt-0.5">Ej. {pendingShopping[0].name}</p>
          )}
        </Link>

        {/* Proxima cita */}
        <Link to="/citas" className="card p-5 hover:shadow-lift transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blush text-berry flex items-center justify-center">
              <CalendarClock size={17} />
            </div>
            <ArrowRight size={15} className="text-ink/20 group-hover:text-berry transition-colors" />
          </div>
          <p className="label mb-0.5">Proxima cita</p>
          {nextAppointment ? (
            <>
              <p className="font-display font-semibold text-lg">{nextAppointment.title}</p>
              <p className="text-sm text-ink/50 mt-0.5">
                {nextAppointment.date} {nextAppointment.time && `· ${nextAppointment.time}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-ink/45">No hay citas pendientes</p>
          )}
        </Link>

        {/* Deseos */}
        <Link to="/deseos" className="card p-5 hover:shadow-lift transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blush text-berry flex items-center justify-center">
              <Gift size={17} />
            </div>
            <ArrowRight size={15} className="text-ink/20 group-hover:text-berry transition-colors" />
          </div>
          <p className="label mb-0.5">Deseos</p>
          <p className="font-display font-semibold text-lg">Ver lista compartida</p>
        </Link>

        {/* Ultima notita */}
        <Link to="/notas" className="card p-5 hover:shadow-lift transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blush text-berry flex items-center justify-center">
              <StickyNote size={17} />
            </div>
            <ArrowRight size={15} className="text-ink/20 group-hover:text-berry transition-colors" />
          </div>
          <p className="label mb-0.5">Ultima notita</p>
          {latestNote ? (
            <p className="font-hand text-lg leading-snug line-clamp-2">{latestNote.message}</p>
          ) : (
            <p className="text-sm text-ink/45">Nadie ha dejado notitas aun</p>
          )}
        </Link>
      </div>
    </div>
  );
}
