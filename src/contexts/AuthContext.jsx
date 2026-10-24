import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || '');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('auth_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Validate session on app mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        setToken('');
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/me');
        const currentUser = res.data?.user || res.data;
        if (currentUser) {
          // Check role: must be operator or admin
          const role = String(currentUser.role || '').toLowerCase();
          if (role !== 'operator' && role !== 'admin') {
            throw new Error('Hanya akun dengan role operator atau admin yang dapat masuk.');
          }
          setUser(currentUser);
          localStorage.setItem('auth_user', JSON.stringify(currentUser));
        }
      } catch (err) {
        // If 401 or role not allowed, clean up session
        console.warn('Session verification failed:', err?.message || err);
        setToken('');
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();

    // Listen for unauthorized 401 events dispatched by api.js
    const handleUnauthorized = () => {
      setToken('');
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/login', { email, password });
    const { token: newToken, user: newUser } = res.data;

    if (!newToken) {
      throw new Error('Token otentikasi tidak ditemukan dalam respons server.');
    }

    const role = String(newUser?.role || '').toLowerCase();
    if (role !== 'operator' && role !== 'admin') {
      throw new Error(
        `Akun '${newUser?.name || email}' memiliki peran '${newUser?.role || 'user'}'. Hanya peran 'operator' atau 'admin' yang dapat login. Hubungi admin sistem utama untuk promosi peran.`
      );
    }

    if (newUser && newUser.is_active === false) {
      throw new Error('Akun Anda sedang dinonaktifkan. Hubungi admin sistem.');
    }

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      const currentToken = localStorage.getItem('auth_token');
      if (currentToken) {
        await api.post('/logout');
      }
    } catch (err) {
      console.warn('Logout endpoint error (clearing local session anyway):', err);
    } finally {
      setToken('');
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/me');
      const currentUser = res.data?.user || res.data;
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('auth_user', JSON.stringify(currentUser));
      }
      return currentUser;
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      throw err;
    }
  }, []);

  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const isOperator = String(user?.role || '').toLowerCase() === 'operator';
  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshProfile,
        isAdmin,
        isOperator,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
