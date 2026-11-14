import { useEffect, useState } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX, HiOutlineCube, HiOutlineEye } from 'react-icons/hi';
import { Loading, Pagination, formatDate, formatTime } from '../components/ui/Shared';
import ImagePreview from '../components/ui/ImagePreview';
import DeletionModal from '../components/ui/DeletionModal';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function deletionNumber(item) {
  if (item.nomor_penghapusan) return item.nomor_penghapusan;
  const yearMonth = item.created_at?.slice(0, 7).replace('-', '') || '000000';
  return `HPS-${yearMonth}-${String(item.id).padStart(3, '0')}`;
}

const statusColors = {
  Menunggu: ['#fef3c7', '#92400e'],
  'Menunggu Persetujuan': ['#fef3c7', '#92400e'],
  Disetujui: ['#dcfce7', '#166534'],
  'Dalam Proses': ['#dbeafe', '#1d4ed8'],
  Selesai: ['#dcfce7', '#166534'],
  Ditolak: ['#fee2e2', '#991b1b'],
};

function ProtectedDeletionPhoto({ requestId, compact = false }) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    api.get(`/asset-deletion-requests/${requestId}/photo`, { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setPhotoUrl(objectUrl);
      })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [requestId]);

  if (failed) return <span style={{ color: 'var(--gray-500)' }}>Foto tidak dapat dimuat</span>;
  if (!photoUrl) return <span style={{ color: 'var(--gray-500)' }}>Memuat foto...</span>;
  return (
    <ImagePreview
      src={photoUrl}
      alt="Foto bukti penghapusan"
      imageStyle={compact
        ? { display: 'block', width: '52px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--gray-200)' }
        : { display: 'block', maxWidth: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--gray-200)' }}
      buttonStyle={compact ? { display: 'block' } : { display: 'block', marginTop: '6px' }}
    />
  );
}

export default function PenghapusanPage() {
  const { canApprove, canManageAssets, isOperator } = useAuth();
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchData = async (pageNum = page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/asset-deletion-requests', { params: { page: pageNum, per_page: 10 } });
      setError('');
      const result = data.requests || {};
      setRequests(result.data || []);
      setPagination({
        currentPage: result.current_page || 1,
        lastPage: result.last_page || 1,
        total: result.total || 0,
        from: result.from || 0,
        to: result.to || 0,
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Data pengajuan penghapusan gagal dimuat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(page); }, [page]);

  return (
    <main className="main-content page-enter" style={{ padding: '24px 28px', maxWidth: '1440px' }}>
      <div className="page-header-row" style={{ marginBottom: '20px' }}>
        <div className="page-header-title-area">
          <div className="page-header-heading">
            <HiOutlineTrash className="page-header-icon" style={{ color: '#dc2626' }} />
            <h1 className="page-header-title">Penghapusan Aset</h1>
          </div>
          <p className="page-header-sub">{canApprove ? 'Tinjau pengajuan dari operasional dan proses persetujuannya.' : 'Ajukan aset untuk ditinjau dan disetujui admin.'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {(isOperator || canManageAssets) && (
            <button className="btn btn-primary page-action-btn" type="button" onClick={() => setIsDeletionModalOpen(true)}>
              <HiOutlinePlus /> Ajukan Penghapusan Baru
            </button>
          )}
        </div>
      </div>

      {success && <div className="alert alert-success" role="status">{success}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <section className="card page-table-card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>{canApprove ? 'Pengajuan dari Operasional' : 'Daftar Pengajuan Saya'}</h2>
          <span className="badge badge-default">{pagination.total} pengajuan</span>
        </div>
        {loading && requests.length === 0 ? <Loading /> : !requests.length ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-500)' }}>Belum ada pengajuan penghapusan aset.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-responsive deletion-table-desktop">
              <table className="table deletion-requests-table">
                <thead><tr><th>No</th><th>No. Penghapusan</th><th>Tanggal</th><th>Aset</th><th>Tempat Pembuangan</th><th>Alasan</th><th>Status Admin</th><th>Catatan Admin</th></tr></thead>
                <tbody>{requests.map((item, index) => {
                  const colors = statusColors[item.status] || statusColors.Menunggu;
                  return (
                  <tr
                    key={item.id}
                    aria-expanded={selectedRequest?.id === item.id}
                    onClick={() => setSelectedRequest(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedRequest(item);
                      }
                    }}
                    aria-label={`Lihat detail pengajuan ${item.aset?.kode_aset || ''}`}
                    tabIndex={0}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ textAlign: 'center', color: 'var(--gray-500)' }}>{(pagination.from || 1) + index}</td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--primary-700)' }}>{deletionNumber(item)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div>{formatDate(item.created_at)}</div>
                      {item.created_at && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>{formatTime(item.created_at)}</div>}
                    </td>
                    <td><strong>{item.aset?.kode_aset || '-'}</strong><br />{item.aset?.nama_aset || '-'}</td>
                    <td>{item.tempat_pembuangan || '-'}</td>
                    <td style={{ whiteSpace: 'normal' }}>{item.alasan}{item.keterangan_tambahan && <div style={{ marginTop: '4px', color: 'var(--gray-500)' }}>{item.keterangan_tambahan}</div>}</td>
                    <td><span style={{ padding: '4px 9px', borderRadius: '999px', background: colors[0], color: colors[1], fontSize: '0.75rem', fontWeight: 700 }}>{item.status}</span></td>
                    <td style={{ whiteSpace: 'normal' }}>{item.catatan_persetujuan || (item.status === 'Menunggu' ? 'Menunggu tinjauan admin' : '-')}</td>
                  </tr>
                  );
                })}</tbody>
              </table>
            </div>

            {/* Mobile Card List View (<= 768px) */}
            <div className="mobile-data-list deletion-mobile-list" style={{ padding: '12px' }}>
              {requests.map((item, index) => {
                const colors = statusColors[item.status] || statusColors.Menunggu;
                const itemNumber = (pagination.from || 1) + index;
                return (
                  <div
                    key={item.id}
                    className="mobile-data-card"
                    onClick={() => setSelectedRequest(item)}
                  >
                    <div className="mobile-data-card-header">
                      <div className="mobile-data-card-id">
                        <span className="mobile-data-card-num">#{itemNumber}</span>
                        <strong className="mobile-data-card-code">{deletionNumber(item)}</strong>
                      </div>
                      <div>
                        <span style={{ padding: '3px 8px', borderRadius: '999px', background: colors[0], color: colors[1], fontSize: '11px', fontWeight: 700 }}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="mobile-data-card-asset">
                      <div className="mobile-data-card-asset-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                        <HiOutlineCube />
                      </div>
                      <div>
                        <div className="mobile-data-card-asset-name">
                          {item.aset?.nama_aset || 'Aset tanpa nama'}
                        </div>
                        <div className="mobile-data-card-asset-sub">
                          Kode: <strong>{item.aset?.kode_aset || '-'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mobile-data-card-grid">
                      <div className="mobile-data-card-meta-item">
                        <span className="mobile-data-card-meta-label">Tanggal</span>
                        <span className="mobile-data-card-meta-value">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      <div className="mobile-data-card-meta-item">
                        <span className="mobile-data-card-meta-label">Tempat Pembuangan</span>
                        <span className="mobile-data-card-meta-value">
                          {item.tempat_pembuangan || '-'}
                        </span>
                      </div>
                      <div className="mobile-data-card-meta-item" style={{ gridColumn: 'span 2' }}>
                        <span className="mobile-data-card-meta-label">Alasan</span>
                        <span className="mobile-data-card-meta-value" style={{ fontWeight: 400 }}>
                          {item.alasan}
                        </span>
                      </div>
                    </div>

                    <div className="mobile-data-card-footer">
                      <button
                        type="button"
                        className="btn btn-secondary mobile-data-card-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(item);
                        }}
                      >
                        <HiOutlineEye /> Lihat Detail
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <Pagination {...pagination} onPageChange={setPage} />
      </section>

      {selectedRequest && (
        <div className="modal-backdrop" onClick={() => setSelectedRequest(null)} style={{ zIndex: 1060 }}>
          <div
            className="modal-dialog"
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: '520px', width: '92%' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HiOutlineTrash style={{ fontSize: '1.2rem', color: '#dc2626' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Detail Penghapusan {deletionNumber(selectedRequest)}</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelectedRequest(null)} aria-label="Tutup">
                <HiOutlineX />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--gray-50)',
                  border: '1px solid var(--gray-200)',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                    {selectedRequest.aset?.kode_aset || `ID: ${selectedRequest.aset_id}`}
                  </div>
                  <h4 style={{ margin: '2px 0 0', fontSize: '1rem', color: 'var(--gray-900)' }}>
                    {selectedRequest.aset?.nama_aset || 'Aset Penghapusan'}
                  </h4>
                </div>
                <span style={{
                  padding: '4px 9px',
                  borderRadius: '999px',
                  background: (statusColors[selectedRequest.status] || statusColors.Menunggu)[0],
                  color: (statusColors[selectedRequest.status] || statusColors.Menunggu)[1],
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>
                  {selectedRequest.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Tanggal Pengajuan</span>
                  <div style={{ fontWeight: 600 }}>{formatDate(selectedRequest.created_at)}</div>
                  {selectedRequest.created_at && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>{formatTime(selectedRequest.created_at)}</div>}
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Petugas Pengaju</span>
                  <div style={{ fontWeight: 600 }}>{selectedRequest.pengaju?.name || '-'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Kategori</span>
                  <div style={{ fontWeight: 500 }}>{selectedRequest.aset?.kategori?.nama_kategori || '-'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Kondisi Aset</span>
                  <div style={{ fontWeight: 500 }}>{selectedRequest.aset?.kondisi || '-'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Nomor Seri</span>
                  <div style={{ fontWeight: 500 }}>{selectedRequest.aset?.nomor_seri || '-'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Merek / Tipe</span>
                  <div style={{ fontWeight: 500 }}>{[selectedRequest.aset?.merek, selectedRequest.aset?.tipe].filter(Boolean).join(' ') || '-'}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Lokasi Aset</span>
                  <div style={{ fontWeight: 500 }}>{selectedRequest.aset?.lokasi || '-'}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Tempat Pembuangan</span>
                  <div style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{selectedRequest.tempat_pembuangan || '-'}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Alasan Penghapusan</span>
                  <div style={{ fontWeight: 500, color: 'var(--gray-800)', background: 'var(--gray-50)', padding: '8px', borderRadius: '6px' }}>
                    {selectedRequest.alasan || '-'}
                  </div>
                </div>
                {selectedRequest.keterangan_tambahan && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Keterangan Tambahan</span>
                    <div style={{ color: 'var(--gray-700)' }}>{selectedRequest.keterangan_tambahan}</div>
                  </div>
                )}
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Catatan Admin</span>
                  <div style={{ color: 'var(--gray-700)' }}>{selectedRequest.catatan_persetujuan || (selectedRequest.status === 'Menunggu' ? 'Menunggu tinjauan admin' : '-')}</div>
                </div>
                {selectedRequest.pemroses && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Diproses oleh</span>
                    <div style={{ color: 'var(--gray-700)' }}>{selectedRequest.pemroses.name}</div>
                  </div>
                )}
                <div style={{ gridColumn: 'span 2', marginTop: '6px' }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Foto Bukti Penghapusan</span>
                  {selectedRequest.foto
                    ? <ProtectedDeletionPhoto requestId={selectedRequest.id} />
                    : <div style={{ color: 'var(--gray-500)', marginTop: '4px' }}>Tidak ada foto bukti.</div>}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
      <DeletionModal
        isOpen={isDeletionModalOpen}
        onClose={() => setIsDeletionModalOpen(false)}
        onSuccess={(data) => {
          setSuccess(data.message || 'Pengajuan penghapusan berhasil dikirim.');
          if (page !== 1) setPage(1);
          else fetchData(1);
        }}
      />
    </main>
  );
}
