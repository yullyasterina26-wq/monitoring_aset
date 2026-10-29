import { useState, useEffect } from 'react';
import {
  HiOutlineClipboardCheck,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineInbox,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { Loading, Badge, kondisiBadge, Pagination, formatDate, formatDateTime } from '../components/ui/Shared';
import InspectionModal from '../components/ui/InspectionModal';
import AssetDetailModal from '../components/ui/AssetDetailModal';
import api from '../services/api';
import useDebouncedValue from '../hooks/useDebouncedValue';

export default function PemeriksaanPage() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, from: 0, to: 0, currentPage: 1, lastPage: 1 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);

  // Modals
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState(null);
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

  useEffect(() => {
    fetchInspections(page);
  }, [page, debouncedSearch]);

  const handleReset = () => {
    setSearch('');
    setPage(1);
  };

  const handleInspectionSuccess = () => {
    setToastMessage('Hasil pemeriksaan fisik aset berhasil disimpan!');
    fetchInspections(1);
    setTimeout(() => setToastMessage(''), 5000);
  };

  const openInspectionAsset = async (inspection) => {
    const assetId = inspection.aset?.id || inspection.aset_id;
    if (!assetId) return;
    try {
      const res = await api.get(`/assets/${assetId}`);
      setSelectedAssetForDetail(res.data?.data || res.data);
    } catch (err) {
      if (inspection.aset) setSelectedAssetForDetail(inspection.aset);
      else console.error('Gagal membuka detail aset pemeriksaan:', err);
    }
  };

  // Condition counts
  const countBaik = inspections.filter((i) => i.kondisi_baru === 'Baik' || i.kondisi === 'Baik').length;
  const countRusakRingan = inspections.filter((i) => i.kondisi_baru === 'Rusak Ringan' || i.kondisi === 'Rusak Ringan').length;
  const countRusakBerat = inspections.filter((i) => i.kondisi_baru === 'Rusak Berat' || i.kondisi === 'Rusak Berat').length;

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <HiOutlineClipboardCheck style={{ fontSize: '1.5rem', color: 'var(--primary-600)' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', margin: 0 }}>
              Pemeriksaan Fisik Aset
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            Catatan inspeksi berkala kondisi fisik dan kesiapan peralatan di lapangan.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsInspectionModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600 }}
          id="btn-open-inspection-modal"
        >
          <HiOutlinePlus style={{ fontSize: '18px' }} />
          <span>Catat Pemeriksaan Baru</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="card" style={{ padding: '16px', borderRadius: '10px' }}>
          <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Pemeriksaan
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: '4px' }}>
            {pagination.total || inspections.length}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '10px' }}>
          <div style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Kondisi Baik
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
            {countBaik}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '10px' }}>
          <div style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Rusak Ringan
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
            {countRusakRingan}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '10px' }}>
          <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Rusak Berat
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
            {countRusakBerat}
          </div>
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
        {loading ? (
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
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                  <th>Tanggal</th>
                  <th>Aset Diperiksa</th>
                  <th>Kondisi Hasil Cek</th>
                  <th>Catatan / Keterangan</th>
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
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {insp.created_at ? formatDateTime(insp.created_at) : (insp.tanggal ? formatDate(insp.tanggal) : '-')}
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
                      <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                        {insp.petugas || insp.user?.name || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
      {selectedAssetForDetail && (
        <AssetDetailModal asset={selectedAssetForDetail} onClose={() => setSelectedAssetForDetail(null)} />
      )}
    </main>
  );
}
