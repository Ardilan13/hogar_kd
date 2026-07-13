import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    api
      .get('/auth/profiles', { auth: false })
      .then(setProfiles)
      .catch(() => setError('No pudimos conectar con el servidor. Revisa que el backend este corriendo.'))
      .finally(() => setLoadingProfiles(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(selected.id, pin);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-berry text-white flex items-center justify-center shadow-lift mb-4">
            <Heart size={26} fill="white" />
          </div>
          <h1 className="font-display font-semibold text-3xl">Nuestra Libreta</h1>
          <p className="text-sm text-ink/55 mt-1">mercado, deudas, planes y fechas, todo en un solo lugar</p>
        </div>

        <div className="card p-6">
          {loadingProfiles ? (
            <div className="flex justify-center py-8 text-ink/40">
              <Loader2 className="animate-spin" />
            </div>
          ) : !selected ? (
            <>
              <p className="label mb-3">¿Quien eres?</p>
              <div className="grid grid-cols-2 gap-3">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelected(p);
                      setError('');
                    }}
                    className="flex flex-col items-center gap-2 border border-line rounded-xl2 py-5 hover:border-berry hover:bg-blush transition-colors"
                  >
                    <span className="text-3xl">{p.avatar}</span>
                    <span className="text-sm font-medium">{p.name}</span>
                  </button>
                ))}
              </div>
              {profiles.length === 0 && !error && (
                <p className="text-sm text-ink/50 text-center py-4">
                  Aun no hay perfiles. Arranca el backend para crearlos automaticamente.
                </p>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setPin('');
                  setError('');
                }}
                className="flex items-center gap-1 text-sm text-ink/50 hover:text-berry mb-4 transition-colors"
              >
                <ArrowLeft size={16} /> Cambiar perfil
              </button>
              <div className="flex flex-col items-center mb-5">
                <span className="text-4xl">{selected.avatar}</span>
                <p className="font-medium mt-1">{selected.name}</p>
              </div>
              <label className="label" htmlFor="pin">
                PIN
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                autoFocus
                className="input text-center tracking-[0.4em] text-lg"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={8}
              />
              {error && <p className="text-sm text-berry-dark mt-2">{error}</p>}
              <button type="submit" disabled={loading || !pin} className="btn-primary w-full mt-5">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Entrar'}
              </button>
            </form>
          )}
        </div>
        {error && !selected && <p className="text-sm text-berry-dark text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
