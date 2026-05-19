'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  checkUser: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const res = await api.getMe();
      if (res && res.usuario) {
        setUser(res.usuario);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res && res.usuario) {
        setUser(res.usuario);
        return res.usuario;
      }
      throw new Error(res.error || 'Credenciales inválidas');
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.logout();
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    } catch (err) {
      console.error('Error durante logout:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default useAuth;
