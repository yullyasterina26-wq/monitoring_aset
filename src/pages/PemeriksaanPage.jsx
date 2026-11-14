import { useState, useEffect } from 'react';
import {
  HiOutlineClipboardCheck,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineInbox,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineCube,
  HiOutlineEye,
} from 'react-icons/hi';
import { Loading, Badge, kondisiBadge, Pagination, formatDate, formatTime } from '../components/ui/Shared';
import InspectionModal from '../components/ui/InspectionModal';
import ProtectedInspectionPhoto from '../components/ui/ProtectedInspectionPhoto';
import api from '../services/api';
import useDebouncedValue from '../hooks/useDebouncedValue';

function inspectionNumber(inspection) {
  const yearMonth = inspection.created_at?.slice(0, 7).replace('-', '') || '000000';
  return `PMR-${yearMonth}-${String(inspection.id).padStart(3, '0')}`;
}

export default function PemeriksaanPage() {
  const [inspections, setInspections] = useState([]);
  const [inspectionStats, setInspectionStats] = useState({
    total: 0,
    menungguBaik: 0,
    menungguRusakRingan: 0,
    menungguRusakBerat: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, from: 0, to: 0, currentPage: 1, lastPage: 1 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  // Modals
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchInspections = (pageNum = 1) => {
    setLoading(true);
    const params = {
      page: pageNum,
      search: debouncedSearch || undefined,
      per_page: 10,
    };

    api.get('/operasional/pemeriksaan', { params })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setInspections(list);
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
        console.error('Error fetching inspections:', err);
      })
      .finally(() => setLoading(false));
  };

  const fetchInspectionStats = async (searchTerm = '') => {
    try {
      const { data } = await api.get('/operasional/pemeriksaan/statistics', {
        params: { search: searchTerm || undefined },
        timeout: 30000,
      });
      const totals = [
        data?.total,
        data?.menunggu_baik,
        data?.menunggu_rusak_ringan,
        data?.menunggu_rusak_berat,
      ];
      if (totals.some((total) => typeof total !== 'number')) {
        throw new Error('Jumlah catatan pemeriksaan tidak tersedia.');
      }
      setInspectionStats({
        total: totals[0],
        menungguBaik: totals[1],
        menungguRusakRingan: totals[2],
        menungguRusakBerat: totals[3],
      });
    } catch (error) {
      console.error('Gagal memuat ringkasan pemeriksaan:', error);
    }
  };

  useEffect(() => {
    fetchInspections(page);
  }, [page, debouncedSearch]);
  useEffect(() => {
    fetchInspectionStats(debouncedSearch);
  }, [debouncedSearch]);

  const handleReset = () => {
    setSearch('');
    setPage(1);
  };

  const handleInspectionSuccess = () => {
    setToastMessage('Hasil pemeriksaan fisik aset berhasil disimpan!');
    fetchInspections(1);
    fetchInspectionStats(debouncedSearch);
    setTimeout(() => setToastMessage(''), 5000);
  };

  const openInspectionAsset = async (inspection) => {
    const assetId = inspection.aset?.id || inspection.aset_id;
    if (!assetId) return;
    setSelectedInspection(null);
    setSelectedAssetForDetail(null);
    try {
      const res = await api.get(`/assets/${assetId}`);
      setSelectedAssetForDetail(res.data?.data || res.data);
      setSelectedInspection(inspection);
    } catch (err) {
      if (inspection.aset) {
        setSelectedAssetForDetail(inspection.aset);
        setSelectedInspection(inspection);
      }
      else console.error('Gagal membuka detail aset pemeriksaan:', err);
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
            <HiOutlineClipboardCheck className="page-header-icon" />
            <h1 className="page-header-title">
              Pemeriksaan Fisik Aset
            </h1>
          </div>
          <p className="page-header-sub">
            Catatan inspeksi berkala kondisi fisik dan kesiapan peralatan di lapangan.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary page-action-btn inspection-create-btn"
          onClick={() => setIsInspectionModalOpen(true)}
          id="btn-open-inspection-modal"
        >
          <HiOutlinePlus style={{ fontSize: '18px' }} />
          <span>Catat Pemeriksaan Baru</span>
        </button>
      </div>


      {/* 4 Kartu Status Pemeriksaan Fisik Aset */}
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
            Total Pemeriksaan
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: '4px' }}>
            {inspectionStats.total}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Semua inspeksi</div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '10px', borderTop: '3px solid #10b981' }}>
          <div style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Menunggu - Baik
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
            {inspectionStats.menungguBaik}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Kondisi siap</div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '10px', borderTop: '3px solid #f59e0b' }}>
          <div style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Menunggu - Rusak Ringan
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
            {inspectionStats.menungguRusakRingan}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Perlu perbaikan</div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '10px', borderTop: '3px solid #ef4444' }}>
          <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Menunggu - Rusak Berat
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
            {inspectionStats.menungguRusakBerat}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Tidak dapat dipakai</div>
        </div>
      </div>

      {/* Search Bar */}
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
              placeholder="Cari aset, kode, atau catatan pemeriksaan..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: '38px', fontSize: '0.875rem' }}
            />
          </div>

          {search && (
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

      {/* Inspections Table */}
      <div className="card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
        {loading && inspections.length === 0 ? (
          <div style={{ padding: '3rem' }}>
            <Loading text="Memuat riwayat pemeriksaan aset..." />
          </div>
        ) : inspections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <HiOutlineInbox style={{ fontSize: '48px', color: 'var(--gray-300)', margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--gray-700)' }}>
              Tidak ada data pemeriksaan
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
              {search ? 'Tidak ditemukan pemeriksaan yang cocok dengan pencarian.' : 'Belum ada catatan pemeriksaan aset.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsInspectionModalOpen(true)}
              style={{ fontSize: '0.85rem' }}
            >
              Catat Pemeriksaan Pertama
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 769px) */}
            <div className="table-responsive pemeriksaan-table-desktop">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                    <th>No. Pemeriksaan</th>
                    <th>Tanggal</th>
                    <th>Aset Diperiksa</th>
                    <th>Kondisi Hasil Cek</th>
                    <th>Catatan / Keterangan</th>
                    <th>Status Admin</th>
                    <th>Petugas</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((insp, idx) => {
                    const kondisiValue = insp.kondisi_baru || insp.kondisi || 'Baik';
                    return (
                      <tr key={insp.id || idx} onClick={() => openInspectionAsset(insp)} style={{ cursor: 'pointer' }} title="Klik baris untuk melihat detail aset">
                        <td style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                          {(pagination.from || 1) + idx}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-800)' }}>
                          {insp.nomor_pemeriksaan || inspectionNumber(insp)}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                          <div>{insp.created_at ? formatDate(insp.created_at) : (insp.tanggal ? formatDate(insp.tanggal) : '-')}</div>
                          {insp.created_at && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>{formatTime(insp.created_at)}</div>}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.85rem' }}>
                            {insp.aset?.nama_aset || insp.nama_aset || `Aset #${insp.aset_id}`}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                            {insp.aset?.kode_aset || insp.kode_aset || '-'}
                          </div>
                        </td>
                        <td>
                          <Badge type={kondisiBadge(kondisiValue)}>{kondisiValue}</Badge>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray-700)', maxWidth: '320px' }}>
                          {insp.keterangan || '-'}
                        </td>
                        <td>
                          <Badge type={insp.status === 'Disetujui' ? 'success' : (insp.status === 'Ditolak' ? 'danger' : 'warning')}>
                            {insp.status || 'Disetujui'}
                          </Badge>
                          {insp.catatan_admin && <small style={{ display: 'block', color: 'var(--gray-500)', maxWidth: '180px' }}>{insp.catatan_admin}</small>}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                          {insp.petugas || insp.user?.name || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (<= 768px) - No Horizontal Scrolling! */}
            <div className="mobile-data-list pemeriksaan-mobile-list">
              {inspections.map((insp, idx) => {
                const itemNumber = (pagination.from || 1) + idx;
                const kondisiValue = insp.kondisi_baru || insp.kondisi || 'Baik';
                return (
                  <div
                    key={insp.id || idx}
                    className="mobile-data-card"
                    onClick={() => openInspectionAsset(insp)}
                  >
                    <div className="mobile-data-card-header">
                      <div className="mobile-data-card-id">
                        <span className="mobile-data-card-num">#{itemNumber}</span>
                        <strong className="mobile-data-card-code">
                          {insp.nomor_pemeriksaan || inspectionNumber(insp)}
                        </strong>
                      </div>
                      <div>
                        <Badge type={kondisiBadge(kondisiValue)}>{kondisiValue}</Badge>
                      </div>
                    </div>

                    <div className="mobile-data-card-asset">
                      <div className="mobile-data-card-asset-icon">
                        <HiOutlineCube />
                      </div>
                      <div>
                        <div className="mobile-data-card-asset-name">
                          {insp.aset?.nama_aset || insp.nama_aset || `Aset #${insp.aset_id}`}
                        </div>
                        <div className="mobile-data-card-asset-sub">
                          Kode: <strong>{insp.aset?.kode_aset || insp.kode_aset || '-'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mobile-data-card-grid">
                      <div className="mobile-data-card-meta-item">
                        <span className="mobile-data-card-meta-label">Status Admin</span>
                        <span className="mobile-data-card-meta-value">
                          <Badge type={insp.status === 'Disetujui' ? 'success' : (insp.status === 'Ditolak' ? 'danger' : 'warning')}>
                            {insp.status || 'Disetujui'}
                          </Badge>
                        </span>
                      </div>
                      <div className="mobile-data-card-meta-item">
                        <span className="mobile-data-card-meta-label">Tanggal Cek</span>
                        <span className="mobile-data-card-meta-value">
                          {insp.created_at ? formatDate(insp.created_at) : (insp.tanggal ? formatDate(insp.tanggal) : '-')}
                        </span>
                      </div>
                      <div className="mobile-data-card-meta-item" style={{ gridColumn: 'span 2' }}>
                        <span className="mobile-data-card-meta-label">Catatan / Keterangan</span>
                        <span className="mobile-data-card-meta-value" style={{ fontWeight: 400 }}>
                          {insp.keterangan || '-'}
                        </span>
                      </div>
                      <div className="mobile-data-card-meta-item" style={{ gridColumn: 'span 2' }}>
                        <span className="mobile-data-card-meta-label">Petugas</span>
                        <span className="mobile-data-card-meta-value">
                          {insp.petugas || insp.user?.name || '-'}
                        </span>
                      </div>
                    </div>

                    <div className="mobile-data-card-footer">
                      <button
                        type="button"
                        className="btn btn-secondary mobile-data-card-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInspectionAsset(insp);
                        }}
                      >
                        <HiOutlineEye /> Lihat Aset
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

      {/* Modal Catat Pemeriksaan */}
      <InspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        onSuccess={handleInspectionSuccess}
      />
      {selectedInspection && selectedAssetForDetail && (
        <div className="modal-backdrop" onClick={() => { setSelectedAssetForDetail(null); setSelectedInspection(null); }} style={{ zIndex: 1060 }}>
          <div className="modal-dialog" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '520px', width: '92%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HiOutlineClipboardCheck style={{ fontSize: '1.2rem', color: 'var(--primary-600)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  Detail Pemeriksaan #{selectedInspection.id}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => { setSelectedAssetForDetail(null); setSelectedInspection(null); }}
                aria-label="Tutup"
              >
                <HiOutlineX />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              <div style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--gray-50)',
                border: '1px solid var(--gray-200)',
                marginBottom: '1rem',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                  {selectedAssetForDetail.kode_aset || '-'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--gray-900)' }}>
                    {selectedAssetForDetail.nama_aset || 'Aset Pemeriksaan'}
                  </h4>
                  <Badge type={kondisiBadge(selectedInspection.kondisi_baru || selectedInspection.kondisi || selectedAssetForDetail.kondisi)}>
                    {selectedInspection.kondisi_baru || selectedInspection.kondisi || selectedAssetForDetail.kondisi || 'Baik'}
                  </Badge>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Tanggal Pemeriksaan</span>
                  <div style={{ fontWeight: 600 }}>{selectedInspection.created_at ? formatDate(selectedInspection.created_at) : '-'}</div>
                  {selectedInspection.created_at && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>{formatTime(selectedInspection.created_at)}</div>}
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Petugas Pemeriksa</span>
                  <div style={{ fontWeight: 600 }}>{selectedInspection.user?.name || selectedInspection.petugas || '-'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Kategori</span>
                  <div style={{ fontWeight: 500 }}>{selectedAssetForDetail.kategori?.nama_kategori || '-'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Kondisi Sebelumnya</span>
                  <div style={{ fontWeight: 500 }}>{selectedInspection.kondisi_lama || '-'}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Lokasi Aset</span>
                  <div style={{ fontWeight: 500 }}>{selectedAssetForDetail.lokasi || '-'}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Catatan Pemeriksaan</span>
                  <div style={{ fontWeight: 500, color: 'var(--gray-800)', background: 'var(--gray-50)', padding: '8px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                    {selectedInspection.keterangan || '-'}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Foto Bukti Pemeriksaan</span>
                  <div style={{ marginTop: '6px' }}>
                    {selectedInspection.foto ? (
                      <ProtectedInspectionPhoto
                        inspectionId={selectedInspection.id}
                        imageStyle={{ display: 'block', maxWidth: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--gray-200)' }}
                        buttonStyle={{ display: 'block' }}
                      />
                    ) : (
                      <span style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Tidak ada foto bukti pemeriksaan.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setSelectedAssetForDetail(null); setSelectedInspection(null); }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
