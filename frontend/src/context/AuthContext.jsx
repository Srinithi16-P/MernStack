import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth]           = useState({ user: null, token: null });
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth');
      if (stored) setAuth(JSON.parse(stored));
    } catch (_) { localStorage.removeItem('auth'); }
    setAuthLoading(false);
  }, []);

  const login = (user, token) => {
    const data = { user, token };
    setAuth(data);
    localStorage.setItem('auth', JSON.stringify(data));
  };

  const logout = () => {
    setAuth({ user: null, token: null });
    localStorage.removeItem('auth');
  };

  const updateUser = (user) => {
    const data = { ...auth, user };
    setAuth(data);
    localStorage.setItem('auth', JSON.stringify(data));
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, updateUser, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }