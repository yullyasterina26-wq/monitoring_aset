import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineSwitchHorizontal,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineInbox,
  HiOutlineEye,
  HiOutlinePaperClip,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineCube,
} from 'react-icons/hi';
import { Loading, Badge, Pagination, formatDate, formatTime } from '../components/ui/Shared';
import MutationModal from '../components/ui/MutationModal';
import ImagePreview from '../components/ui/ImagePreview';
import api, { getStorageUrl } from '../services/api';
import useDebouncedValue from '../hooks/useDebouncedValue';

function ProtectedMutationPhoto({ mutation }) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    api.get(`/mutations/${mutation.id}/photo`, { responseType: 'blob' })
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
  }, [mutation.id]);

  if (failed) return <div style={{ color: 'var(--gray-500)', fontSize: '0.8rem', marginTop: '6px' }}>Foto tidak dapat dimuat.</div>;
  if (!photoUrl) return <div style={{ color: 'var(--gray-500)', fontSize: '0.8rem', marginTop: '6px' }}>Memuat foto...</div>;
  return <ImagePreview src={photoUrl} alt="Foto bukti mutasi" imageStyle={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--gray-200)' }} buttonStyle={{ display: 'block', marginTop: '6px' }} />;
}

export default function MutasiPage() {
  const { isAdmin } = useAuth();
  const [mutations, setMutations] = useState([]);
  const [mutationStats, setMutationStats] = useState({ total: 0, menunggu: 0, disetujui: 0, selesai: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, from: 0, to: 0, currentPage: 1, lastPage: 1 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [selectedMutation, setSelectedMutation] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchMutations = (pageNum = 1) => {
    setLoading(true);
    const params = {
      page: pageNum,
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      per_page: 10,
    };

    api.get('/mutations', { params })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setMutations(list);
        if (res.data?.current_page) {
          setPagination({
            currentPage: res.data.current_page,
            lastPage: res.data.last_page,
            total: res.data.total || 0,
            from: res.data.from || 0,
            to: res.data.to || 0,
          });
        } else {
          setPagination({
            currentPage: 1,
            lastPage: 1,
            total: list.length,
            from: list.length > 0 ? 1 : 0,
            to: list.length,
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching mutations:', err);
      })
      .finally(() => setLoading(false));
  };

  const fetchMutationStats = async () => {
    try {
      const [all, pending, approved, processing, completed] = await Promise.all([
        api.get('/mutations', { params: { per_page: 1 } }),
        api.get('/mutations', { params: { status: 'Menunggu', per_page: 1 } }),
        api.get('/mutations', { params: { status: 'Disetujui', per_page: 1 } }),
        api.get('/mutations', { params: { status: 'Diproses', per_page: 1 } }),
        api.get('/mutations', { params: { status: 'Selesai', per_page: 1 } }),
      ]);
      const totals = [all, pending, approved, processing, completed].map(({ data }) => data?.total);
      if (totals.some((total) => typeof total !== 'number')) {
        throw new Error('Jumlah pengajuan mutasi tidak tersedia.');
      }
      setMutationStats({
        total: totals[0],
        menunggu: totals[1],
        disetujui: totals[2] + totals[3],
        selesai: totals[4],
      });
    } catch (error) {
      console.error('Gagal memuat ringkasan mutasi:', error);
    }
  };

  useEffect(() => {
    fetchMutations(page);
  }, [page, statusFilter, debouncedSearch]);
  useEffect(() => {
    fetchMutationStats();
  }, []);

  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const openDetail = async (id) => {
    try {
      const res = await api.get(`/mutations/${id}`);
      setSelectedMutation(res.data?.data || res.data);
    } catch (err) {
      console.error('Error fetching mutation detail:', err);
      // Fallback from existing list item
      const item = mutations.find((m) => m.id === id);
      if (item) setSelectedMutation(item);
    }
  };

  const handleMutationSuccess = () => {
    setToastMessage('Pengajuan mutasi berhasil dikirim! Menunggu persetujuan admin.');
    fetchMutations(1);
    fetchMutationStats();
    setTimeout(() => setToastMessage(''), 6000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Menunggu':
        return <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Menunggu</span>;
      case 'Disetujui':
      case 'Diproses':
        return <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Disetujui</span>;
      case 'Selesai':
        return <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Selesai</span>;
      case 'Ditolak':
        return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Ditolak</span>;
      default:
        return <Badge type="default">{status || '-'}</Badge>;
    }
  };

  return (
    <main className="main-content page-enter" style={{ padding: '24px 28px', maxWidth: '1440px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="alert alert-success"
          style={{
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <HiOutlineCheckCircle style={{ fontSize: '18px' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-title-area">
          <div className="page-header-heading">
            <HiOutlineSwitchHorizontal className="page-header-icon" />
            <h1 className="page-header-title">
              Mutasi Aset
            </h1>
          </div>
          <p className="page-header-sub">
            Pengajuan pemindahan lokasi fisik aset dan riwayat status mutasi operasional.
          </p>
        </div>

        {!isAdmin && <button
          type="button"
          className="btn btn-primary page-action-btn"
          onClick={() => setIsMutationModalOpen(true)}
          id="btn-open-mutation-modal"
        >
          <HiOutlinePlus style={{ fontSize: '18px' }} />
          <span>Ajukan Mutasi Baru</span>
        </button>}
      </div>


      {/* 4 Kartu Status Mutasi Aset */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="card" style={{ padding: '16px', borderRadius: '10px', borderTop: '3px solid #64748b' }}>
          <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Pengajuan
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: '4px' }}>
            {mutationStats.total}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Semua mutasi</div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '10px', borderTop: '3px solid #f59e0b' }}>
          <div style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Menunggu Persetujuan
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
            {mutationStats.menunggu}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Perlu ditinjau</div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '10px', borderTop: '3px solid #3b82f6' }}>
          <div style={{ color: '#2563eb', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Disetujui
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
            {mutationStats.disetujui}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Dalam proses</div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '10px', borderTop: '3px solid #10b981' }}>
          <div style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Selesai
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
            {mutationStats.selesai}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Mutasi tuntas</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          border: '1px solid var(--gray-200)',
        }}
      >
        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <HiOutlineSearch
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gray-400)',
                fontSize: '18px',
              }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Cari aset, kode, lokasi, atau petugas..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: '38px', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '0.875rem' }}
            >
              <option value="">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          {(search || statusFilter) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <HiOutlineRefresh />
              <span>Reset</span>
            </button>
          )}
        </form>
      </div>

      {/* Mutations List */}
      <div className="card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
        {loading && mutations.length === 0 ? (
          <div style={{ padding: '3rem' }}>
            <Loading text="Memuat daftar mutasi aset..." />
          </div>
        ) : mutations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <HiOutlineInbox style={{ fontSize: '48px', color: 'var(--gray-300)', margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--gray-700)' }}>
              Tidak ada data pengajuan mutasi
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
              {search || statusFilter
                ? 'Tidak ditemukan mutasi yang sesuai filter pencarian.'
                : 'Belum ada pengajuan mutasi aset yang dicatat.'}
            </p>
            {!isAdmin && <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsMutationModalOpen(true)}
              style={{ fontSize: '0.85rem' }}
            >
              Ajukan Mutasi Sekarang
            </button>}
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 769px) */}
            <div className="table-responsive mutasi-table-desktop">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                    <th>No. Mutasi</th>
                    <th>Tanggal</th>
                    <th>Aset</th>
                    <th>Lokasi Asal</th>
                    <th>Lokasi Tujuan</th>
                    <th>Unit Tujuan</th>
                    <th>Petugas</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {mutations.map((m, idx) => (
                    <tr key={m.id || idx} onClick={() => openDetail(m.id)} style={{ cursor: 'pointer' }} title="Klik baris untuk melihat detail mutasi">
                      <td style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                        {(pagination.from || 1) + idx}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-800)' }}>
                        {m.nomor_mutasi || '-'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        <div>{m.tanggal_mutasi ? formatDate(m.tanggal_mutasi) : '-'}</div>
                        {m.created_at && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>{formatTime(m.created_at)}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.85rem' }}>
                          {m.aset?.nama_aset || m.nama_aset || `Aset #${m.aset_id}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                          {m.aset?.kode_aset || m.kode_aset || '-'}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                        {m.lokasi_asal || '-'}
                      </td>
                      <td style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-700)' }}>
                        {m.lokasi_tujuan || '-'}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                        {m.unit_tujuan || '-'}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>
                        {m.petugas || '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {getStatusBadge(m.status)}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openDetail(m.id)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Lihat Detail Mutasi"
                        >
                          <HiOutlineEye />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (<= 768px) - No Horizontal Scrolling! */}
            <div className="mobile-data-list mutasi-mobile-list">
              {mutations.map((m, idx) => {
                const itemNumber = (pagination.from || 1) + idx;
                return (
                  <div
                    key={m.id || idx}
                    className="mobile-data-card"
                    onClick={() => openDetail(m.id)}
                  >
                    <div className="mobile-data-card-header">
                      <div className="mobile-data-card-id">
                        <span className="mobile-data-card-num">#{itemNumber}</span>
                        <strong className="mobile-data-card-code">{m.nomor_mutasi || '-'}</strong>
                      </div>
                      <div>{getStatusBadge(m.status)}</div>
                    </div>

                    <div className="mobile-data-card-asset">
                      <div className="mobile-data-card-asset-icon">
                        <HiOutlineCube />
                      </div>
                      <div>
                        <div className="mobile-data-card-asset-name">
                          {m.aset?.nama_aset || m.nama_aset || `Aset #${m.aset_id}`}
                        </div>
                        <div className="mobile-data-card-asset-sub">
                          Kode: <strong>{m.aset?.kode_aset || m.kode_aset || '-'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mobile-data-card-grid">
                      <div className="mobile-data-card-meta-item">
                        <span className="mobile-data-card-meta-label">Lokasi Asal</span>
                        <span className="mobile-data-card-meta-value">{m.lokasi_asal || '-'}</span>
                      </div>
                      <div className="mobile-data-card-meta-item">
                        <span className="mobile-data-card-meta-label">Lokasi Tujuan</span>
                        <span className="mobile-data-card-meta-value" style={{ color: 'var(--primary-700)' }}>
                          {m.lokasi_tujuan || '-'}
                        </span>
                      </div>
                      <div className="mobile-data-card-meta-item">
                        <span className="mobile-data-card-meta-label">Unit Tujuan</span>
                        <span className="mobile-data-card-meta-value">{m.unit_tujuan || '-'}</span>
                      </div>
                      <div className="mobile-data-card-meta-item">
                        <span className="mobile-data-card-meta-label">Tgl Mutasi</span>
                        <span className="mobile-data-card-meta-value">
                          {m.tanggal_mutasi ? formatDate(m.tanggal_mutasi) : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="mobile-data-card-footer">
                      <button
                        type="button"
                        className="btn btn-secondary mobile-data-card-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(m.id);
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

        {/* Pagination Footer */}
        {pagination.lastPage > 1 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--gray-100)' }}>
            <Pagination
              currentPage={pagination.currentPage}
              lastPage={pagination.lastPage}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* Modal Pengajuan Mutasi */}
      <MutationModal
        isOpen={!isAdmin && isMutationModalOpen}
        onClose={() => setIsMutationModalOpen(false)}
        onSuccess={handleMutationSuccess}
      />

      {/* Modal Detail Mutasi */}
      {selectedMutation && (
        <div className="modal-backdrop" onClick={() => setSelectedMutation(null)} style={{ zIndex: 1060 }}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', width: '92%' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HiOutlineSwitchHorizontal style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Detail Mutasi #{selectedMutation.id}</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedMutation(null)} aria-label="Tutup">
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
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                    {selectedMutation.aset?.kode_aset || selectedMutation.kode_aset || `ID: ${selectedMutation.aset_id}`}
                  </div>
                  <h4 style={{ margin: '2px 0 0', fontSize: '1rem', color: 'var(--gray-900)' }}>
                    {selectedMutation.aset?.nama_aset || selectedMutation.nama_aset || 'Aset Mutasi'}
                  </h4>
                </div>
                <div>{getStatusBadge(selectedMutation.status)}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Tanggal Mutasi</span>
                  <div style={{ fontWeight: 600 }}>
                    {selectedMutation.tanggal_mutasi ? formatDate(selectedMutation.tanggal_mutasi) : '-'}
                  </div>
                  {selectedMutation.created_at && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>Diajukan {formatTime(selectedMutation.created_at)}</div>}
                </div>

                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Petugas Pengaju</span>
                  <div style={{ fontWeight: 600 }}>{selectedMutation.petugas || '-'}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Lokasi Asal</span>
                  <div style={{ fontWeight: 500, color: 'var(--gray-700)' }}>{selectedMutation.lokasi_asal || '-'}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Lokasi Tujuan Baru</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{selectedMutation.lokasi_tujuan || '-'}</div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Unit Kerja Tujuan</span>
                  <div style={{ fontWeight: 500 }}>{selectedMutation.unit_tujuan || '-'}</div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Alasan Mutasi</span>
                  <div style={{ fontWeight: 500, color: 'var(--gray-800)', background: 'var(--gray-50)', padding: '8px', borderRadius: '6px' }}>
                    {selectedMutation.alasan || '-'}
                  </div>
                </div>

                {selectedMutation.keterangan && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Keterangan Tambahan</span>
                    <div style={{ color: 'var(--gray-700)' }}>{selectedMutation.keterangan}</div>
                  </div>
                )}

                {selectedMutation.foto_mutasi && (
                  <div style={{ gridColumn: 'span 2', marginTop: '6px' }}>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Foto Bukti Mutasi</span>
                    <ProtectedMutationPhoto mutation={selectedMutation} />
                  </div>
                )}

                {selectedMutation.dokumen && (
                  <div style={{ gridColumn: 'span 2', marginTop: '6px' }}>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Dokumen Lampiran</span>
                    <div style={{ marginTop: '4px' }}>
                      <a
                        href={getStorageUrl(selectedMutation.dokumen)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
                      >
                        <HiOutlinePaperClip />
                        <span>Unduh Dokumen Mutasi</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedMutation(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
