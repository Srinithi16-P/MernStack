import { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [auth, setAuth]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token && parsed?.user?.role === 1) setAuth(parsed);
      }
    } catch { localStorage.removeItem('admin_auth'); }
    setAuthLoading(false);
  }, []);

  const login = (user, token) => {
    const d = { user, token };
    setAuth(d);
    localStorage.setItem('admin_auth', JSON.stringify(d));
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem('admin_auth');
  };

  return (
    <AdminAuthContext.Provider value={{ auth, authLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() { return useContext(AdminAuthContext); }