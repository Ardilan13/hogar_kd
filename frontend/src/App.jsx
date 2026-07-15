import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Shopping from './pages/Shopping';
import Debts from './pages/Debts';
import Wishlist from './pages/Wishlist';
import CalendarPage from './pages/Calendar';
import Appointments from './pages/Appointments';
import Notes from './pages/Notes';
import Gallery from './pages/Gallery';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="mercado" element={<Shopping />} />
        <Route path="deudas" element={<Debts />} />
        <Route path="deseos" element={<Wishlist />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="citas" element={<Appointments />} />
        <Route path="notas" element={<Notes />} />
        <Route path="galeria" element={<Gallery />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
