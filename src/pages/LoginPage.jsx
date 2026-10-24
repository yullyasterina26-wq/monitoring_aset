import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MdFlight } from 'react-icons/md';
import {
  HiOutlineServer,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
  HiOutlineQrcode,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import ServerConfigModal from '../components/ui/ServerConfigModal';
import QrScannerModal from '../components/ui/QrScannerModal';
import AssetDetailModal from '../components/ui/AssetDetailModal';
import { getApiBaseUrl } from '../services/api';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState(null);
  const [activeBaseUrl, setActiveBaseUrl] = useState(() => getApiBaseUrl());

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err.isNetworkError) {
        setError(
          `Gagal terhubung ke server di ${activeBaseUrl}. Pastikan server Laravel sedang berjalan dan periksa konfigurasi IP/Wi-Fi.`
        );
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          'Login gagal. Periksa kembali email dan kata sandi Anda.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequiresLoginAction = (action, asset) => {
    if (action && asset?.id) {
      sessionStorage.setItem('pending_operator_action', JSON.stringify({ action, asset }));
      setError(`Login untuk melanjutkan ${action === 'loan' ? 'pengajuan peminjaman' : action === 'mutation' ? 'pengajuan mutasi' : 'pemeriksaan'} aset ${asset.kode_aset || asset.nama_aset}.`);
      return;
    }
    setError('Aksi ini memerlukan autentikasi. Silakan login dengan akun operator/admin.');
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
        <div className="login-logo">
          <div className="logo-icon"><MdFlight /></div>
          <h1>SIMA Operator</h1>
          <p>Sistem Operasional Manajemen Aset<br />Bandara Supadio - Airport Technology</p>
        </div>

        {/* Server Connection Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--gray-50)',
            border: '1px solid var(--gray-200)',
            borderRadius: '8px',
            padding: '6px 12px',
            marginBottom: '1rem',
            fontSize: '0.75rem',
            color: 'var(--gray-600)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <HiOutlineServer style={{ color: 'var(--primary-600)', flexShrink: 0, fontSize: '14px' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              API: <strong>{activeBaseUrl}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsServerModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-600)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.75rem',
              padding: '2px 4px',
              textDecoration: 'underline',
              flexShrink: 0,
            }}
          >
            Ubah
          </button>
        </div>

        {error && (
          <div
            className="login-error"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              textAlign: 'left',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              marginBottom: '1rem',
            }}
          >
            <HiOutlineExclamationCircle style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Akun</label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="operator@angkasapura.co.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Kata Sandi</label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', marginTop: '0.5rem', padding: '10px' }}
          >
            {submitting ? 'Memproses Masuk...' : 'Masuk ke Aplikasi'}
          </button>

          {/* Quick Public QR Scan Button (No Login Required) */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsQrScannerOpen(true)}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
            id="btn-public-scan-qr"
          >
            <HiOutlineQrcode style={{ fontSize: '18px', color: 'var(--primary-600)' }} />
            <span>Pindai QR / Cek Aset Publik (Tanpa Login)</span>
          </button>
        </form>

        {/* Informative notice on roles */}
        <div
          style={{
            marginTop: '1.25rem',
            padding: '10px 12px',
            borderRadius: '6px',
            background: 'var(--primary-50)',
            border: '1px solid var(--primary-100)',
            fontSize: '0.75rem',
            color: 'var(--primary-900)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            textAlign: 'left',
          }}
        >
          <HiOutlineInformationCircle style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px', color: 'var(--primary-600)' }} />
          <span>
            Hanya akun dengan peran <strong>operator</strong> atau <strong>admin</strong> yang aktif yang dapat masuk. Akun dengan peran biasa (user) perlu diubah oleh admin sistem utama.
          </span>
        </div>
      </div>

      {/* Public QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onViewDetail={(asset) => setSelectedAssetForDetail(asset)}
        onSelectAssetForLoan={(asset) => handleRequiresLoginAction('loan', asset)}
        onSelectAssetForMutation={(asset) => handleRequiresLoginAction('mutation', asset)}
        onSelectAssetForInspection={(asset) => handleRequiresLoginAction('inspection', asset)}
      />

      {/* Public Asset Detail Modal */}
      <AssetDetailModal
        asset={selectedAssetForDetail}
        onClose={() => setSelectedAssetForDetail(null)}
        onPinjam={(asset) => handleRequiresLoginAction('loan', asset)}
        onMutasi={(asset) => handleRequiresLoginAction('mutation', asset)}
        onPemeriksaan={(asset) => handleRequiresLoginAction('inspection', asset)}
      />

      {/* Server Config Modal */}
      <ServerConfigModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        onSaved={(newUrl) => setActiveBaseUrl(newUrl)}
      />
    </div>
  );
}
