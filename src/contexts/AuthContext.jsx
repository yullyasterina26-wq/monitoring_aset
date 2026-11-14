import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const ADMIN_ROLES = ['admin_persetujuan', 'super_admin', 'admin_aset', 'admin'];

function isAllowedRole(role) {
  return role === 'operator' || ADMIN_ROLES.includes(role);
}

function getRoleLabel(role) {
  return ({
    operator: 'Operator',
    admin_aset: 'Admin Aset',
    admin_persetujuan: 'Admin Persetujuan',
    super_admin: 'Super Admin',
    admin: 'Super Admin',
  })[String(role || '').toLowerCase()] || role || 'Operator';
}

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
          const role = String(currentUser.role || '').toLowerCase();
          if (!isAllowedRole(role)) {
            console.warn('Session verification failed: account role is not allowed.');
            setToken('');
            setUser(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            return;
          }
          setUser(currentUser);
          localStorage.setItem('auth_user', JSON.stringify(currentUser));
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.warn('Session verification failed:', err?.message || err);
          setToken('');
          setUser(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        } else {
          console.warn('Session verification is temporarily unavailable; keeping the saved session:', err?.message || err);
        }
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
    if (!isAllowedRole(role)) {
      throw new Error(
        `Akun '${newUser?.name || email}' memiliki peran '${newUser?.role || 'user'}' yang tidak diizinkan. Hubungi administrator sistem.`
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

  const role = String(user?.role || '').toLowerCase();
  const isAdmin = ADMIN_ROLES.includes(role);
  const isSuperAdmin = role === 'super_admin' || role === 'admin';
  const canManageAssets = isSuperAdmin;
  const canApprove = isSuperAdmin || role === 'admin_persetujuan' || role === 'admin_aset';
  const isOperator = role === 'operator';
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
        isSuperAdmin,
        canManageAssets,
        canApprove,
        isOperator,
        roleLabel: getRoleLabel(user?.role),
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
