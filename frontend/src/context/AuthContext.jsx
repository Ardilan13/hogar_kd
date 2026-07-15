import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

function persistSession(token, user) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  localStorage.setItem('pareja_token', token);
  localStorage.setItem('pareja_user', JSON.stringify(user));
  localStorage.setItem('pareja_session_expires', expiresAt);
}

function clearSession() {
  localStorage.removeItem('pareja_token');
  localStorage.removeItem('pareja_user');
  localStorage.removeItem('pareja_session_expires');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('pareja_user');
    const token = localStorage.getItem('pareja_token');
    const expiresAt = localStorage.getItem('pareja_session_expires');
    if (stored && token && (!expiresAt || new Date(expiresAt) > new Date())) {
      setUser(JSON.parse(stored));
    } else {
      clearSession();
    }
    setLoading(false);
  }, []);

  async function login(userId, pin) {
    const data = await api.post('/auth/login', { userId, pin }, { auth: false });
    persistSession(data.token, data.user);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
