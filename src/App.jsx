import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DataAsetPage from './pages/DataAsetPage';
import PeminjamanSayaPage from './pages/PeminjamanSayaPage';
import MutasiPage from './pages/MutasiPage';
import PemeriksaanPage from './pages/PemeriksaanPage';
import AktivitasPage from './pages/AktivitasPage';
import DokumenPage from './pages/DokumenPage';
import LaporanPage from './pages/LaporanPage';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%' }} />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('monitoring-aset-theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('monitoring-aset-theme', theme);
  }, [theme]);

  return (
    <Routes>
      {/* Login route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected operator app routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout theme={theme} onThemeChange={setTheme} />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="aset" element={<DataAsetPage />} />
        <Route path="peminjaman" element={<PeminjamanSayaPage />} />
        <Route path="mutasi" element={<MutasiPage />} />
        <Route path="pemeriksaan" element={<PemeriksaanPage />} />
        <Route path="aktivitas" element={<AktivitasPage />} />
        <Route path="dokumen" element={<DokumenPage />} />
        <Route path="laporan" element={<LaporanPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
