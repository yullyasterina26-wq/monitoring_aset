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
import PenghapusanPage from './pages/PenghapusanPage';
import ProfilPage from './pages/ProfilPage';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children, operational = false, deletionRequest = false }) {
  const { isAuthenticated, loading, isOperator, canApprove, canManageAssets } = useAuth();
  if (loading && !isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin" style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%' }} />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (operational && !isOperator && !canApprove) {
    return <Navigate to="/" replace />;
  }
  if (deletionRequest && !isOperator && !canApprove && !canManageAssets) {
    return <Navigate to="/" replace />;
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
        <Route path="peminjaman" element={<ProtectedRoute operational><PeminjamanSayaPage /></ProtectedRoute>} />
        <Route path="mutasi" element={<ProtectedRoute operational><MutasiPage /></ProtectedRoute>} />
        <Route path="pemeriksaan" element={<ProtectedRoute operational><PemeriksaanPage /></ProtectedRoute>} />
        <Route path="penghapusan" element={<ProtectedRoute deletionRequest><PenghapusanPage /></ProtectedRoute>} />
        <Route path="profil" element={<ProfilPage />} />
        <Route path="aktivitas" element={<ProtectedRoute operational><AktivitasPage /></ProtectedRoute>} />
        <Route path="dokumen" element={<ProtectedRoute operational><DokumenPage /></ProtectedRoute>} />
        <Route path="laporan" element={<ProtectedRoute operational><LaporanPage /></ProtectedRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
