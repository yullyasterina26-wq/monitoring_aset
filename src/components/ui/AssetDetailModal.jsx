import { useState, useEffect } from 'react';
import {
  HiOutlineX,
  HiOutlineCube,
  HiOutlineClock,
  HiOutlineSwitchHorizontal,
  HiOutlineClipboardCheck,
  HiOutlineLockClosed,
} from 'react-icons/hi';
import { MdHandshake } from 'react-icons/md';
import { Badge, kondisiBadge, formatDateTime } from './Shared';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function AssetDetailModal({
  asset,
  onClose,
  onPinjam,
  onMutasi,
  onPemeriksaan,
}) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('detail'); // 'detail' | 'history'
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    setActiveTab('detail');
    setHistoryList([]);
  }, [asset]);

  useEffect(() => {
    if (activeTab === 'history' && asset?.id && isAuthenticated) {
      setHistoryLoading(true);
      api.get(`/assets/${asset.id}/history`, { params: { per_page: 10 } })
        .then((res) => {
          const list = res.data?.data || res.data || [];
          setHistoryList(list);
        })
        .catch((err) => {
          console.error('Error fetching asset history:', err);
        })
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab, asset?.id, isAuthenticated]);

  if (!asset) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1060 }}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineCube style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Detail Aset: {asset.kode_aset}</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Tutup">
            <HiOutlineX />
          </button>
        </div>

        {/* Tab switcher: Detail & Riwayat */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--gray-200)',
            padding: '0 20px',
            background: 'var(--gray-50)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('detail')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              fontWeight: activeTab === 'detail' ? 700 : 500,
              color: activeTab === 'detail' ? 'var(--primary-700)' : 'var(--gray-600)',
              borderBottom: activeTab === 'detail' ? '2px solid var(--primary-600)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Spesifikasi &amp; Lokasi
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              fontWeight: activeTab === 'history' ? 700 : 500,
              color: activeTab === 'history' ? 'var(--primary-700)' : 'var(--gray-600)',
              borderBottom: activeTab === 'history' ? '2px solid var(--primary-600)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <HiOutlineClock />
            <span>Riwayat Aset</span>
            {!isAuthenticated && (
              <HiOutlineLockClosed style={{ fontSize: '13px', color: 'var(--gray-400)' }} />
            )}
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
          {/* TAB DETAIL */}
          {activeTab === 'detail' && (
            <>
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  background: 'var(--gray-50)',
                  border: '1px solid var(--gray-200)',
                  marginBottom: '1rem',
                }}
              >
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--gray-900)' }}>
                  {asset.nama_aset}
                </h4>
                <div style={{ marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Badge type={kondisiBadge(asset.kondisi)}>{asset.kondisi}</Badge>
                  <Badge type="info">{asset.kategori?.nama_kategori || asset.kategori || 'Perangkat'}</Badge>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Kode Aset</div>
                  <div style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{asset.kode_aset}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Kategori</div>
                  <div style={{ fontWeight: 500 }}>{asset.kategori?.nama_kategori || asset.kategori || '-'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Merek / Tipe</div>
                  <div style={{ fontWeight: 500 }}>{asset.merek || asset.model || '-'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Nomor Seri</div>
                  <div style={{ fontWeight: 500 }}>{asset.nomor_seri || '-'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Ukuran / Dimensi</div>
                  <div style={{ fontWeight: 500 }}>{asset.ukuran || '-'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Tahun Pengadaan</div>
                  <div style={{ fontWeight: 500 }}>
                    {asset.tahun_pengadaan || asset.tahun_perolehan || '-'}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Lokasi Penempatan</div>
                  <div style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{asset.lokasi || '-'}</div>
                </div>

                <div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Unit Pengguna</div>
                  <div style={{ fontWeight: 500 }}>{asset.unit || '-'}</div>
                </div>
              </div>

              {asset.spesifikasi && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-100)' }}>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginBottom: '4px' }}>Spesifikasi Teknis</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-800)', whiteSpace: 'pre-wrap' }}>
                    {asset.spesifikasi}
                  </div>
                </div>
              )}

              {asset.keterangan && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginBottom: '4px' }}>Keterangan</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>
                    {asset.keterangan}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB RIWAYAT ASET */}
          {activeTab === 'history' && (
            <div>
              {!isAuthenticated ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <HiOutlineLockClosed style={{ fontSize: '32px', color: 'var(--gray-400)', margin: '0 auto 8px' }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: 'var(--gray-800)' }}>
                    Riwayat Memerlukan Login
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--gray-500)' }}>
                    Sesuai kebijakan keamanan, riwayat pergerakan dan pemeliharaan aset hanya dapat diakses oleh operator atau admin yang telah login.
                  </p>
                </div>
              ) : historyLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div
                    className="animate-spin"
                    style={{
                      width: '28px',
                      height: '28px',
                      border: '3px solid var(--primary-200)',
                      borderTopColor: 'var(--primary-600)',
                      borderRadius: '50%',
                      margin: '0 auto 8px',
                    }}
                  />
                  <span style={{ fontSize: '0.825rem', color: 'var(--gray-500)' }}>Memuat riwayat aset...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                  Belum ada catatan riwayat pergerakan atau pemeriksaan untuk aset ini.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {historyList.map((hist, idx) => (
                    <div
                      key={hist.id || idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--gray-50)',
                        border: '1px solid var(--gray-200)',
                        fontSize: '0.825rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary-800)' }}>
                          {hist.aktivitas || hist.kegiatan || hist.jenis || 'Aktivitas Operasional'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                          {hist.created_at ? formatDateTime(hist.created_at) : (hist.tanggal || '-')}
                        </span>
                      </div>
                      <p style={{ margin: '2px 0', color: 'var(--gray-700)' }}>
                        {hist.keterangan || hist.catatan || '-'}
                      </p>
                      {hist.petugas && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: '4px' }}>
                          Petugas: <strong>{hist.petugas}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="modal-footer"
          style={{
            borderTop: '1px solid var(--gray-100)',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {/* Quick Transaction Action Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {onPinjam && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onPinjam(asset);
                }}
                style={{ fontSize: '0.8rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Ajukan Peminjaman"
              >
                <MdHandshake />
                <span>Pinjam</span>
              </button>
            )}

            {onMutasi && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onMutasi(asset);
                }}
                style={{ fontSize: '0.8rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Ajukan Mutasi"
              >
                <HiOutlineSwitchHorizontal />
                <span>Mutasi</span>
              </button>
            )}

            {onPemeriksaan && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onPemeriksaan(asset);
                }}
                style={{ fontSize: '0.8rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Catat Pemeriksaan Fisik"
              >
                <HiOutlineClipboardCheck />
                <span>Periksa</span>
              </button>
            )}
          </div>

          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
