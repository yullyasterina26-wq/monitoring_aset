import { useState, useEffect, useRef } from 'react';
import {
  HiOutlineQrcode,
  HiOutlineCamera,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineExclamationCircle,
  HiOutlineCube,
  HiOutlineDocumentReport,
  HiOutlineSwitchHorizontal,
} from 'react-icons/hi';
import { MdHandshake } from 'react-icons/md';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../services/api';
import { Badge, kondisiBadge } from './Shared';

export default function QrScannerModal({
  isOpen,
  onClose,
  onSelectAssetForLoan,
  onSelectAssetForMutation,
  onSelectAssetForInspection,
  onViewDetail,
}) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scannedCode, setScannedCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null); // Asset object or null
  const [lookupError, setLookupError] = useState('');

  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);

  // Stop camera helper
  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping QR scanner:', err);
      } finally {
        isScanningRef.current = false;
        setCameraActive(false);
      }
    }
  };

  // Close and cleanup
  const handleClose = async () => {
    await stopCamera();
    setLookupResult(null);
    setLookupError('');
    setScannedCode('');
    setManualCode('');
    setCameraError('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Lookup asset by code via public endpoint GET /api/assets/by-code/{kode}
  const lookupAssetByCode = async (rawCode) => {
    if (!rawCode || !rawCode.trim()) return;

    let cleanCode = rawCode.trim();
    // Safety check: if user scans a URL containing asset code, extract the last segment or code
    try {
      if (cleanCode.startsWith('http://') || cleanCode.startsWith('https://')) {
        const url = new URL(cleanCode);
        const codeParam = url.searchParams.get('kode') || url.searchParams.get('code');
        if (codeParam) {
          cleanCode = codeParam;
        } else {
          const segments = url.pathname.split('/').filter(Boolean);
          cleanCode = segments[segments.length - 1] || cleanCode;
        }
      }
    } catch {
      // keep raw string if URL parsing fails
    }

    setScannedCode(cleanCode);
    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const res = await api.get(`/assets/by-code/${encodeURIComponent(cleanCode)}`);
      const asset = res.data?.data || res.data;
      if (asset) {
        setLookupResult(asset);
      } else {
        setLookupError(`Aset dengan kode "${cleanCode}" tidak ditemukan.`);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setLookupError(`Aset dengan kode "${cleanCode}" tidak ditemukan dalam sistem.`);
      } else {
        setLookupError(err.response?.data?.message || 'Gagal mencari aset. Periksa koneksi ke server.');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  // Start camera scanning ONLY when user presses button
  const startCamera = async () => {
    setCameraError('');
    setLookupResult(null);
    setLookupError('');

    try {
      // Create reader instance if not exists
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
      }

      setCameraActive(true);
      isScanningRef.current = true;

      const config = {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' }, // Back camera
        config,
        async (decodedText) => {
          // Success callback: prevent repeated scans
          if (isScanningRef.current) {
            isScanningRef.current = false;
            await stopCamera();
            lookupAssetByCode(decodedText);
          }
        },
        () => {
          // Frame parse error - ignore standard noise
        }
      );
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraActive(false);
      isScanningRef.current = false;
      const msg = String(err?.message || err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setCameraError('Izin akses kamera ditolak. Harap izinkan akses kamera di browser ponsel Anda.');
      } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
        setCameraError('Kamera tidak ditemukan pada perangkat ini.');
      } else {
        setCameraError(`Gagal membuka kamera: ${msg}. Pastikan URL dibuka lewat HTTPS atau localhost untuk akses kamera.`);
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    lookupAssetByCode(manualCode);
  };

  const handleScanAgain = () => {
    setLookupResult(null);
    setLookupError('');
    setScannedCode('');
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineQrcode style={{ fontSize: '1.3rem', color: 'var(--primary-600)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Pindai QR / Cari Kode Aset</h3>
          </div>
          <button className="modal-close" onClick={handleClose} aria-label="Tutup">
            <HiOutlineX />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
          {/* Tab Selection: Kamera vs Manual */}
          <div
            style={{
              display: 'flex',
              background: 'var(--gray-100)',
              borderRadius: '8px',
              padding: '4px',
              marginBottom: '1rem',
            }}
          >
            <button
              type="button"
              onClick={async () => {
                await stopCamera();
                setActiveTab('camera');
              }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === 'camera' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'camera' ? 700 : 500,
                color: activeTab === 'camera' ? 'var(--primary-700)' : 'var(--gray-600)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: activeTab === 'camera' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <HiOutlineCamera style={{ fontSize: '16px' }} />
              <span>Kamera Ponsel</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await stopCamera();
                setActiveTab('manual');
              }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === 'manual' ? '#ffffff' : 'transparent',
                fontWeight: activeTab === 'manual' ? 700 : 500,
                color: activeTab === 'manual' ? 'var(--primary-700)' : 'var(--gray-600)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: activeTab === 'manual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <HiOutlineSearch style={{ fontSize: '16px' }} />
              <span>Ketik Kode</span>
            </button>
          </div>

          {/* TAB 1: CAMERA SCAN */}
          {activeTab === 'camera' && !lookupResult && !lookupLoading && (
            <div style={{ textAlign: 'center' }}>
              {!cameraActive && (
                <div
                  style={{
                    padding: '2rem 1rem',
                    border: '2px dashed var(--gray-300)',
                    borderRadius: '12px',
                    background: 'var(--gray-50)',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'var(--primary-100)',
                      color: 'var(--primary-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      margin: '0 auto 12px',
                    }}
                  >
                    <HiOutlineCamera />
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--gray-900)' }}>
                    Pindai Kode QR / Barcode Fisik
                  </h4>
                  <p style={{ margin: '0 0 16px', fontSize: '0.825rem', color: 'var(--gray-600)' }}>
                    Kamera belakang ponsel akan digunakan untuk membaca label QR pada aset.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={startCamera}
                    style={{ padding: '10px 24px', fontSize: '0.9rem', fontWeight: 600 }}
                    id="btn-start-camera"
                  >
                    Mulai Pindai Kamera
                  </button>
                </div>
              )}

              {cameraError && (
                <div
                  className="alert alert-danger"
                  style={{
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    textAlign: 'left',
                    marginBottom: '1rem',
                  }}
                >
                  <HiOutlineExclamationCircle style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div>{cameraError}</div>
                    <div style={{ marginTop: '4px', fontSize: '0.75rem', opacity: 0.9 }}>
                      Tip: Gunakan tab <strong>Ketik Kode</strong> di atas jika kamera browser tidak didukung.
                    </div>
                  </div>
                </div>
              )}

              {/* Viewfinder container */}
              <div
                id="qr-reader-container"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: cameraActive ? 'block' : 'none',
                  background: '#000000',
                  minHeight: '260px',
                }}
              />

              {cameraActive && (
                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={stopCamera}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Hentikan Kamera
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL INPUT */}
          {activeTab === 'manual' && !lookupResult && !lookupLoading && (
            <form onSubmit={handleManualSubmit} style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="manual-asset-code" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Kode Aset (misal: AST-001)
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <input
                    id="manual-asset-code"
                    type="text"
                    className="form-control"
                    placeholder="Masukkan kode aset persis..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    autoFocus
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    Cari Aset
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* LOADING STATE */}
          {lookupLoading && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div
                className="animate-spin"
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid var(--primary-200)',
                  borderTopColor: 'var(--primary-600)',
                  borderRadius: '50%',
                  margin: '0 auto 12px',
                }}
              />
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gray-700)', fontWeight: 500 }}>
                Mencari aset dengan kode <strong>{scannedCode}</strong>...
              </p>
            </div>
          )}

          {/* ERROR STATE */}
          {lookupError && !lookupLoading && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                className="alert alert-danger"
                style={{
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left',
                  marginBottom: '1rem',
                }}
              >
                <HiOutlineExclamationCircle style={{ fontSize: '20px', flexShrink: 0 }} />
                <span>{lookupError}</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleScanAgain}
                style={{ fontSize: '0.85rem' }}
              >
                Cari Kode Lain
              </button>
            </div>
          )}

          {/* SUCCESS RESULT: PREVIEW ASSET CARD */}
          {lookupResult && !lookupLoading && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'var(--gray-50)',
                  border: '1px solid var(--gray-200)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 700 }}>
                      {lookupResult.kode_aset}
                    </span>
                    <h4 style={{ margin: '2px 0 6px', fontSize: '1.05rem', color: 'var(--gray-900)' }}>
                      {lookupResult.nama_aset}
                    </h4>
                  </div>
                  <Badge type={kondisiBadge(lookupResult.kondisi)}>{lookupResult.kondisi}</Badge>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    fontSize: '0.8rem',
                    marginTop: '10px',
                    borderTop: '1px solid var(--gray-200)',
                    paddingTop: '10px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.72rem' }}>Kategori:</span>
                    <div style={{ fontWeight: 600 }}>
                      {lookupResult.kategori?.nama_kategori || lookupResult.kategori || '-'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.72rem' }}>Merek / Tipe:</span>
                    <div style={{ fontWeight: 600 }}>{lookupResult.merek || lookupResult.model || '-'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.72rem' }}>Nomor Seri:</span>
                    <div style={{ fontWeight: 600 }}>{lookupResult.nomor_seri || '-'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.72rem' }}>Ukuran:</span>
                    <div style={{ fontWeight: 600 }}>{lookupResult.ukuran || '-'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.72rem' }}>Lokasi Penempatan:</span>
                    <div style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
                      {lookupResult.lokasi || '-'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.72rem' }}>Unit / Tahun:</span>
                    <div style={{ fontWeight: 600 }}>
                      {lookupResult.unit || '-'} ({lookupResult.tahun_pengadaan || lookupResult.tahun_perolehan || '-'})
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS FOR THE SCANNED ASSET */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    handleClose();
                    if (onViewDetail) onViewDetail(lookupResult);
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <HiOutlineCube />
                  <span>Lihat Detail Lengkap &amp; Riwayat</span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      handleClose();
                      if (onSelectAssetForLoan) onSelectAssetForLoan(lookupResult);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}
                  >
                    <MdHandshake style={{ fontSize: '16px' }} />
                    <span>Ajukan Pinjam</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      handleClose();
                      if (onSelectAssetForMutation) onSelectAssetForMutation(lookupResult);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}
                  >
                    <HiOutlineSwitchHorizontal style={{ fontSize: '16px' }} />
                    <span>Ajukan Mutasi</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      handleClose();
                      if (onSelectAssetForInspection) onSelectAssetForInspection(lookupResult);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}
                  >
                    <HiOutlineDocumentReport style={{ fontSize: '16px' }} />
                    <span>Catat Pemeriksaan</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleScanAgain}
                  style={{ marginTop: '4px', fontSize: '0.8rem' }}
                >
                  Pindai Aset Lain
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
