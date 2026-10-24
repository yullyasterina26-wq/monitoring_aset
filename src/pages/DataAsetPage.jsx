import { useState, useEffect } from 'react';
import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineInbox,
  HiOutlineCheckCircle,
  HiOutlineQrcode,
  HiOutlineCube,
} from 'react-icons/hi';
import { QRCodeSVG } from 'qrcode.react';
import { Loading, Badge, kondisiBadge, Pagination } from '../components/ui/Shared';
import LoanModal from '../components/ui/LoanModal';
import MutationModal from '../components/ui/MutationModal';
import InspectionModal from '../components/ui/InspectionModal';
import AssetDetailModal from '../components/ui/AssetDetailModal';
import QrScannerModal from '../components/ui/QrScannerModal';
import api from '../services/api';

export default function DataAsetPage() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, from: 0, to: 0, currentPage: 1, lastPage: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [kondisi, setKondisi] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState(null);
  const [selectedAssetForLoan, setSelectedAssetForLoan] = useState(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedAssetForMutation, setSelectedAssetForMutation] = useState(null);
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [selectedAssetForInspection, setSelectedAssetForInspection] = useState(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrPrintAsset, setQrPrintAsset] = useState(null);

  const [toastMessage, setToastMessage] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        const catList = res.data?.data || res.data || [];
        setCategories(catList);
      })
      .catch((err) => {
        console.warn('Error fetching categories:', err);
      });
  }, []);

  // Fetch assets with pagination and filters
  const fetchAssets = (pageNum = 1) => {
    setLoading(true);
    const params = {
      page: pageNum,
      search: search || undefined,
      kategori_id: kategoriId || undefined,
      kondisi: kondisi || undefined,
      per_page: 10,
    };

    api.get('/assets', { params })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setAssets(list);
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
        console.error('Error fetching assets:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets(page);
  }, [page, kategoriId, kondisi]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAssets(1);
  };

  const handleReset = () => {
    setSearch('');
    setKategoriId('');
    setKondisi('');
    setPage(1);
    fetchAssets(1);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 5000);
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
            <HiOutlineCube style={{ fontSize: '1.5rem', color: 'var(--primary-600)' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', margin: 0 }}>
              Daftar Aset
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            Katalog data inventaris perangkat dan peralatan kerja bandara.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsQrScannerOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600 }}
          id="btn-scan-qr-assets"
        >
          <HiOutlineQrcode style={{ fontSize: '18px' }} />
          <span>Pindai QR / Kode</span>
        </button>
      </div>

      {/* Filter Card */}
      <div
        className="card"
        style={{
          padding: '16px',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          border: '1px solid var(--gray-200)',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Keyword Search */}
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
              placeholder="Cari nama aset, kode, serial number, atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '38px', fontSize: '0.875rem' }}
            />
          </div>

          {/* Kategori Filter */}
          <div style={{ width: '180px' }}>
            <select
              className="form-control"
              value={kategoriId}
              onChange={(e) => {
                setKategoriId(e.target.value);
                setPage(1);
              }}
              style={{ fontSize: '0.875rem' }}
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nama_kategori}
                </option>
              ))}
            </select>
          </div>

          {/* Kondisi Filter */}
          <div style={{ width: '160px' }}>
            <select
              className="form-control"
              value={kondisi}
              onChange={(e) => {
                setKondisi(e.target.value);
                setPage(1);
              }}
              style={{ fontSize: '0.875rem' }}
            >
              <option value="">Semua Kondisi</option>
              <option value="Baik">Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            Cari
          </button>

          {(search || kategoriId || kondisi) && (
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

      {/* Assets Table */}
      <div className="card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
        {loading ? (
          <div style={{ padding: '3.5rem' }}>
            <Loading text="Memuat daftar aset..." />
          </div>
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <HiOutlineInbox style={{ fontSize: '48px', color: 'var(--gray-300)', margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--gray-700)' }}>
              Tidak ada aset ditemukan
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray-500)' }}>
              Coba gunakan kata kunci pencarian lain atau ubah filter kategori/kondisi.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                  <th>Kode Aset</th>
                  <th>Nama Aset</th>
                  <th>Kategori</th>
                  <th>Merek / Serial No</th>
                  <th>Lokasi</th>
                  <th style={{ textAlign: 'center' }}>Kondisi</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((item, idx) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedAssetForDetail(item)}
                    style={{ cursor: 'pointer' }}
                    title="Klik untuk melihat detail lengkap aset"
                  >
                    <td style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                      {(pagination.from || 1) + idx}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-700)', fontSize: '0.85rem' }}>
                        {item.kode_aset}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.875rem' }}>
                        {item.nama_aset}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        Unit: {item.unit || '-'}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>
                      {item.kategori?.nama_kategori || item.kategori || '-'}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-800)' }}>{item.merek || '-'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>SN: {item.nomor_seri || '-'}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--gray-800)' }}>
                      {item.lokasi || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge type={kondisiBadge(item.kondisi)}>{item.kondisi}</Badge>
                    </td>
                    <td
                      style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setSelectedAssetForDetail(item)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setQrPrintAsset(item)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Lihat Kode QR"
                        >
                          <HiOutlineQrcode />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* QR Code Modal for Asset */}
      {qrPrintAsset && (
        <div className="modal-backdrop" onClick={() => setQrPrintAsset(null)} style={{ zIndex: 1070 }}>
          <div
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '380px', width: '90%', textAlign: 'center' }}
          >
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Label QR: {qrPrintAsset.kode_aset}</h3>
              <button className="modal-close" onClick={() => setQrPrintAsset(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div
                style={{
                  padding: '16px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  display: 'inline-block',
                  border: '1px solid var(--gray-200)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <QRCodeSVG value={qrPrintAsset.kode_aset} size={180} level="H" />
              </div>
              <h4 style={{ margin: '14px 0 2px', fontSize: '1rem', color: 'var(--gray-900)' }}>
                {qrPrintAsset.nama_aset}
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary-700)', fontWeight: 700 }}>
                {qrPrintAsset.kode_aset}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                Lokasi: {qrPrintAsset.lokasi || '-'}
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setQrPrintAsset(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onViewDetail={(asset) => setSelectedAssetForDetail(asset)}
        onSelectAssetForLoan={(asset) => {
          setSelectedAssetForLoan(asset);
          setIsLoanModalOpen(true);
        }}
        onSelectAssetForMutation={(asset) => {
          setSelectedAssetForMutation(asset);
          setIsMutationModalOpen(true);
        }}
        onSelectAssetForInspection={(asset) => {
          setSelectedAssetForInspection(asset);
          setIsInspectionModalOpen(true);
        }}
      />

      {/* Detail Modal */}
      <AssetDetailModal
        asset={selectedAssetForDetail}
        onClose={() => setSelectedAssetForDetail(null)}
        onPinjam={(asset) => {
          setSelectedAssetForLoan(asset);
          setIsLoanModalOpen(true);
        }}
        onMutasi={(asset) => {
          setSelectedAssetForMutation(asset);
          setIsMutationModalOpen(true);
        }}
        onPemeriksaan={(asset) => {
          setSelectedAssetForInspection(asset);
          setIsInspectionModalOpen(true);
        }}
      />

      {/* Loan Modal */}
      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => {
          setIsLoanModalOpen(false);
          setSelectedAssetForLoan(null);
        }}
        initialAsset={selectedAssetForLoan}
        onSuccess={() => {
          showToast('Pengajuan peminjaman berhasil dibuat! Menunggu persetujuan admin.');
          fetchAssets(page);
        }}
      />

      {/* Mutation Modal */}
      <MutationModal
        isOpen={isMutationModalOpen}
        onClose={() => {
          setIsMutationModalOpen(false);
          setSelectedAssetForMutation(null);
        }}
        initialAsset={selectedAssetForMutation}
        onSuccess={() => {
          showToast('Pengajuan mutasi aset berhasil dibuat! Menunggu persetujuan admin.');
          fetchAssets(page);
        }}
      />

      {/* Inspection Modal */}
      <InspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setSelectedAssetForInspection(null);
        }}
        initialAsset={selectedAssetForInspection}
        onSuccess={() => {
          showToast('Catatan pemeriksaan aset berhasil disimpan!');
          fetchAssets(page);
        }}
      />
    </main>
  );
}
