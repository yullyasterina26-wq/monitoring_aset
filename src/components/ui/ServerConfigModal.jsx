import { useState } from 'react';
import {
  HiOutlineServer,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineWifi,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import {
  getApiBaseUrl,
  setCustomApiBaseUrl,
  resetCustomApiBaseUrl,
  testApiConnection,
} from '../../services/api';

export default function ServerConfigModal({ isOpen, onClose, onSaved }) {
  const [urlInput, setUrlInput] = useState(() => getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: bool, message: string }
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTest = async (testUrl) => {
    const target = testUrl || urlInput;
    setTesting(true);
    setTestResult(null);
    setSavedSuccess(false);

    const res = await testApiConnection(target);
    setTesting(false);
    if (res.success) {
      setTestResult({
        success: true,
        message: 'Koneksi berhasil! Server Laravel merespons API dengan baik.',
      });
    } else {
      setTestResult({
        success: false,
        message: `Gagal terhubung (${res.error}). Periksa kembali IP, port 8000, dan koneksi Wi-Fi.`,
      });
    }
  };

  const handleSave = () => {
    setCustomApiBaseUrl(urlInput);
    setSavedSuccess(true);
    if (onSaved) onSaved(getApiBaseUrl());
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    resetCustomApiBaseUrl();
    const def = getApiBaseUrl();
    setUrlInput(def);
    setTestResult(null);
    setSavedSuccess(true);
    if (onSaved) onSaved(def);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineServer style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Konfigurasi Server API</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Tutup">
            <HiOutlineX />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
          <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
            Atur alamat server backend Laravel yang melayani API. Untuk pengujian lewat HP pada jaringan Wi-Fi, gunakan IP LAN komputer server.
          </p>

          {/* Preset Buttons */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>
              Pilihan Cepat
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => {
                  setUrlInput('/api');
                  handleTest('/api');
                }}
              >
                Lokal / Proxy (/api)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => {
                  const guess = `http://${window.location.hostname}:8000/api`;
                  setUrlInput(guess);
                  handleTest(guess);
                }}
              >
                IP Host Ini (:8000/api)
              </button>
            </div>
          </div>

          {/* Input field */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="api-base-url" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Base URL API
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input
                id="api-base-url"
                type="text"
                className="form-control"
                placeholder="misal: http://192.168.1.10:8000/api"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                style={{ flex: 1, fontSize: '0.875rem' }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleTest()}
                disabled={testing}
                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Uji koneksi ke URL ini"
              >
                <HiOutlineRefresh className={testing ? 'animate-spin' : ''} />
                {testing ? 'Menguji...' : 'Uji'}
              </button>
            </div>
          </div>

          {/* Test feedback */}
          {testResult && (
            <div
              className={`alert ${testResult.success ? 'alert-success' : 'alert-danger'}`}
              style={{
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '1rem',
              }}
            >
              {testResult.success ? (
                <HiOutlineCheck style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <HiOutlineExclamationCircle style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }} />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {savedSuccess && (
            <div
              className="alert alert-success"
              style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}
            >
              <HiOutlineCheck style={{ fontSize: '18px' }} />
              <span>Pengaturan server berhasil disimpan!</span>
            </div>
          )}

          {/* Troubleshooting Guide Box */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)',
              fontSize: '0.8rem',
              color: 'var(--gray-700)',
            }}
          >
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--gray-900)' }}>
              <HiOutlineWifi style={{ color: 'var(--primary-600)' }} />
              <span>Panduan Koneksi LAN Wi-Fi:</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>
                Jalankan Laravel dengan binding host LAN:
                <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', margin: '0 4px' }}>
                  php artisan serve --host=0.0.0.0 --port=8000
                </code>
              </li>
              <li>
                Cek IP komputer di PowerShell:
                <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', margin: '0 4px' }}>
                  ipconfig
                </code>
                (lihat baris IPv4 Address).
              </li>
              <li>Pastikan ponsel dan laptop terhubung ke <strong>Wi-Fi yang sama</strong>.</li>
              <li>Buka port 8000 pada Windows Defender Firewall agar permintaan HP tidak diblokir.</li>
              <li>
                <HiOutlineShieldCheck style={{ verticalAlign: 'middle', marginRight: '4px', color: '#16a34a' }} />
                Untuk pemindaian kamera HP di browser mobile, jalankan lewat HTTPS atau browser yang mengizinkan WebRTC lokal.
              </li>
            </ul>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            style={{ fontSize: '0.8rem' }}
          >
            Reset Default
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Simpan &amp; Terapkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
