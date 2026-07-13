import { useEffect, useState } from 'react';
import { Coins, Plus, Trash2, Loader2, Check, Scale } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDateShort } from '../utils/format';

export default function Debts() {
  const { user } = useAuth();
  const [debts, setDebts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [balance, setBalance] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPaid, setShowPaid] = useState(false);
  const [form, setForm] = useState({ from: '', to: '', amount: '', description: '' });

  function load() {
    setLoading(true);
    Promise.all([
      api.get('/debts'),
      api.get('/debts/summary/balance'),
      api.get('/auth/profiles', { auth: false })
    ])
      .then(([d, b, p]) => {
        setDebts(d);
        setBalance(b);
        setProfiles(p);
        if (p.length >= 2 && !form.from) {
          setForm((f) => ({ ...f, from: p[0].name, to: p[1].name }));
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.amount || form.from === form.to) return;
    setSaving(true);
    try {
      await api.post('/debts', { ...form, amount: Number(form.amount), paid: false });
      setForm((f) => ({ ...f, amount: '', description: '' }));
      setOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function togglePaid(debt) {
    await api.put(`/debts/${debt.id}`, { paid: !debt.paid, paidAt: !debt.paid ? new Date().toISOString() : null });
    load();
  }

  async function remove(id) {
    if (!window.confirm('¿Borrar esta deuda?')) return;
    await api.del(`/debts/${id}`);
    load();
  }

  const names = Object.keys(balance);
  const balanceEntries = names.filter((n) => balance[n] !== 0);
  const visibleDebts = debts.filter((d) => (showPaid ? true : !d.paid));

  return (
    <div>
      <PageHeader
        eyebrow="Cuentas claras"
        title="Deudas"
        description="Lo que se deben el uno al otro, sin enredos"
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={18} /> Registrar deuda
          </button>
        }
      />

      {!loading && (
        <div className="card p-5 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blush text-berry flex items-center justify-center shrink-0">
            <Scale size={18} />
          </div>
          {balanceEntries.length === 0 ? (
            <p className="text-sm font-medium">Estan a paz y salvo 🎉</p>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {balanceEntries
                .filter((n) => balance[n] < 0)
                .map((n) => {
                  const owedTo = names.find((m) => balance[m] > 0);
                  return (
                    <p key={n} className="text-sm">
                      <span className="font-semibold">{n}</span> le debe{' '}
                      <span className="font-semibold text-berry-dark">
                        {formatCurrency(Math.abs(balance[n]))}
                      </span>{' '}
                      a <span className="font-semibold">{owedTo}</span>
                    </p>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-ink/30">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : debts.length === 0 ? (
        <EmptyState
          icon={Coins}
          title="No hay deudas registradas"
          description="Cuando uno pague algo por el otro, registralo aqui para no perder la cuenta."
          action={
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus size={18} /> Registrar deuda
            </button>
          }
        />
      ) : (
        <>
          <div className="flex justify-end mb-3">
            <label className="flex items-center gap-2 text-sm text-ink/55">
              <input
                type="checkbox"
                checked={showPaid}
                onChange={(e) => setShowPaid(e.target.checked)}
                className="rounded accent-berry"
              />
              Mostrar pagadas
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {visibleDebts.map((debt) => (
              <div key={debt.id} className={`voucher ${debt.paid ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <p className="font-hand text-xl leading-none">
                    {debt.from} → {debt.to}
                  </p>
                  <button
                    onClick={() => remove(debt.id)}
                    className="text-ink/25 hover:text-berry transition-colors"
                    aria-label="Borrar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="font-display font-semibold text-2xl mt-1">
                  {formatCurrency(debt.amount)}
                </p>
                {debt.description && (
                  <p className="text-sm text-ink/60 mt-1">{debt.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-ink/40">{formatDateShort(debt.createdAt?.slice(0, 10))}</span>
                  <button
                    onClick={() => togglePaid(debt)}
                    className={`text-xs font-medium flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${
                      debt.paid ? 'bg-sage/15 text-sage-dark' : 'bg-berry/10 text-berry-dark hover:bg-berry/20'
                    }`}
                  >
                    <Check size={12} /> {debt.paid ? 'Pagada' : 'Marcar pagada'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar deuda">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="from">Quien debe</label>
              <select
                id="from"
                className="input"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="to">A quien</label>
              <select
                id="to"
                className="input"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          {form.from === form.to && (
            <p className="text-xs text-berry-dark">Elige dos personas distintas</p>
          )}
          <div>
            <label className="label" htmlFor="amount">Monto</label>
            <input
              id="amount"
              type="number"
              min="0"
              step="1"
              className="input"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
            />
          </div>
          <div>
            <label className="label" htmlFor="description">¿Por que?</label>
            <input
              id="description"
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ej. Uber, cena, mercado..."
            />
          </div>
          <button
            type="submit"
            disabled={saving || !form.amount || form.from === form.to}
            className="btn-primary w-full"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Registrar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
