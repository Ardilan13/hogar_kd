import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  Coins,
  Gift,
  CalendarHeart,
  CalendarClock,
  StickyNote,
  LogOut,
  Menu,
  X,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/mercado', label: 'Mercado', icon: ShoppingCart },
  { to: '/deudas', label: 'Deudas', icon: Coins },
  { to: '/deseos', label: 'Deseos', icon: Gift },
  { to: '/calendario', label: 'Fechas especiales', icon: CalendarHeart },
  { to: '/citas', label: 'Citas y pendientes', icon: CalendarClock },
  { to: '/notas', label: 'Notitas', icon: StickyNote }
];

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="w-9 h-9 rounded-xl bg-berry text-white flex items-center justify-center shadow-paper">
        <Heart size={18} fill="white" />
      </div>
      <div>
        <p className="font-display font-semibold text-lg leading-none">Nuestra Libreta</p>
        <p className="text-[11px] text-ink/50 mt-0.5">para lo nuestro, ordenado</p>
      </div>
    </div>
  );
}

function NavList({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) => `tab-link ${isActive ? 'active' : ''}`}
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar de escritorio */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-line bg-white/60 p-5 sticky top-0 h-screen">
        <div className="mb-8">
          <Brand />
        </div>
        <NavList />
        <div className="mt-auto pt-4 border-t border-line flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blush flex items-center justify-center text-lg">
            {user?.avatar || '💕'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="text-ink/40 hover:text-berry transition-colors p-1.5"
            title="Cerrar sesion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Barra superior movil */}
      <header className="lg:hidden sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line">
        <div className="flex items-center justify-between px-4 py-3">
          <Brand />
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-blush transition-colors"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="px-4 pb-4">
            <NavList onNavigate={() => setMobileOpen(false)} />
            <button
              onClick={logout}
              className="tab-link w-full mt-1 text-berry-dark"
            >
              <LogOut size={18} />
              Cerrar sesion ({user?.name})
            </button>
          </div>
        )}
      </header>

      {/* Contenido */}
      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
