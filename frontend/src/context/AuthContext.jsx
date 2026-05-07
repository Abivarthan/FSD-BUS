import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fleet_token');
    const savedUser = localStorage.getItem('fleet_user');
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        localStorage.removeItem('fleet_token');
        localStorage.removeItem('fleet_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { token, user: userData } = data.data;
    localStorage.setItem('fleet_token', token);
    localStorage.setItem('fleet_user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('fleet_token');
    localStorage.removeItem('fleet_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';
  const isDriver = () => user?.role === 'driver';
  const isCustomer = () => user?.role === 'customer';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isDriver, isCustomer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
