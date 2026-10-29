import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUserCircle,
  HiOutlineCog,
  HiOutlineCube,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineSwitchHorizontal,
  HiOutlineSearch,
} from 'react-icons/hi';
import StatCard from '../components/ui/StatCard';
import QuickActions from '../components/ui/QuickActions';
import AssetTable from '../components/ui/AssetTable';
import LoanModal from '../components/ui/LoanModal';
import MutationModal from '../components/ui/MutationModal';
import InspectionModal from '../components/ui/InspectionModal';
import AssetDetailModal from '../components/ui/AssetDetailModal';
import QrScannerModal from '../components/ui/QrScannerModal';
import api from '../services/api';
import { formatDateTime } from '../components/ui/Shared';
import useDebouncedValue from '../hooks/useDebouncedValue';

export default function DashboardPage() {
  const navigate = useNavigate();

  // Stats state
  const [dashboardData, setDashboardData] = useState(null);
  const [asetTersediaCount, setAsetTersediaCount] = useState(0);
  const [peminjamanSayaCount, setPeminjamanSayaCount] = useState(0);
  const [menungguPersetujuanCount, setMenungguPersetujuanCount] = useState(0);
  const [menungguMutasiCount, setMenungguMutasiCount] = useState(0);
  const [, setStatsLoading] = useState(true);

  // Available assets table state
  const [availableAssets, setAvailableAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetSearch, setAssetSearch] = useState('');
  const debouncedAssetSearch = useDebouncedValue(assetSearch);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // Modals state
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedAssetForLoan, setSelectedAssetForLoan] = useState(null);
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [selectedAssetForMutation, setSelectedAssetForMutation] = useState(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedAssetForInspection, setSelectedAssetForInspection] = useState(null);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState(null);

  const [toastMessage, setToastMessage] = useState('');

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    setStatsLoading(true);

    // 1. Fetch summary from /operasional/dashboard
    try {
      const dashRes = await api.get('/operasional/dashboard');
      setDashboardData(dashRes.data || null);
    } catch (dashErr) {
      console.warn('Dashboard summary endpoint fetch:', dashErr);
    }

    // 2. Fetch loans count
    try {
      const loanRes = await api.get('/loans', { params: { per_page: 50 } });
      const loanList = loanRes.data?.data || loanRes.data || [];
      const ongoing = loanList.filter((l) => l.status === 'Dipinjam' || l.status === 'Diproses').length;
      setPeminjamanSayaCount(ongoing);
      const pending = loanList.filter((l) => l.status === 'Menunggu').length;
      setMenungguPersetujuanCount(pending);
    } catch (err) {
      console.error('Error fetching loans for stats:', err);
    }

    // 4. Fetch mutations count
    try {
      const mutRes = await api.get('/mutations', { params: { per_page: 50 } });
      const mutList = mutRes.data?.data || mutRes.data || [];
      const pendingMut = mutList.filter((m) => m.status === 'Menunggu').length;
      setMenungguMutasiCount(pendingMut);
    } catch (err) {
      console.warn('Error fetching mutations for stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAvailableAssets = async (search = '') => {
    setAssetsLoading(true);
    try {
      const assetRes = await api.get('/assets', {
        params: { kondisi: 'Baik', per_page: 8, search: search || undefined },
      });
      const assetData = assetRes.data?.data || assetRes.data || [];
      const validAvailable = assetData.filter((a) => a.kondisi === 'Baik');
      setAvailableAssets(validAvailable);
      if (!search) {
        setAsetTersediaCount(assetRes.data?.total !== undefined ? assetRes.data.total : validAvailable.length);
      }
    } catch (err) {
      console.error('Error fetching available assets:', err);
    } finally {
      setAssetsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const pendingAction = sessionStorage.getItem('pending_operator_action');
    if (!pendingAction) return;

    sessionStorage.removeItem('pending_operator_action');
    try {
      const { action, asset } = JSON.parse(pendingAction);
      if (!asset?.id) return;
      if (action === 'loan') {
        setSelectedAssetForLoan(asset);
        setIsLoanModalOpen(true);
      } else if (action === 'mutation') {
        setSelectedAssetForMutation(asset);
        setIsMutationModalOpen(true);
      } else if (action === 'inspection') {
        setSelectedAssetForInspection(asset);
        setIsInspectionModalOpen(true);
      }
    } catch (error) {
      console.warn('Konteks tindakan sebelum login tidak dapat dibaca:', error);
    }
  }, []);

  useEffect(() => {
    fetchAvailableAssets(debouncedAssetSearch);
  }, [debouncedAssetSearch]);

  const showToast = (msg) => {
    setToastMessage(msg);
    fetchDashboardData();
    fetchAvailableAssets(debouncedAssetSearch);
    setTimeout(() => setToastMessage(''), 5000);
  };

  return (
    <main className="main-content page-enter">
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
          <HiOutlineCheck style={{ fontSize: '18px' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Description */}
      <div
        className="dashboard-page-header"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--primary-600)',
                fontSize: '1.5rem',
              }}
            >
              <HiOutlineUserCircle />
              <HiOutlineCog style={{ fontSize: '1.25rem', opacity: 0.8 }} />
            </div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--gray-900)',
                margin: 0,
                letterSpacing: '-0.3px',
              }}
            >
              Dashboard Operator
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Pindai QR fisik, ajukan peminjaman &amp; mutasi, serta catat pemeriksaan berkala aset.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              fetchDashboardData();
              fetchAvailableAssets(debouncedAssetSearch);
            }}
            style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            id="btn-refresh-dashboard"
          >
            Muat Ulang
          </button>
        </div>
      </div>

      {/* 4 Stat Cards in a row */}
      <div
        className="stats-grid-4"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* A. Aset Tersedia */}
        <StatCard
          title="ASET TERSEDIA"
          value={asetTersediaCount}
          description="Kondisi baik &amp; siap dipinjam"
          badgeText="Siap Digunakan"
          icon={HiOutlineCube}
          color="blue"
          onClick={() => navigate('/aset')}
        />

        {/* B. Peminjaman Saya */}
        <StatCard
          title="PEMINJAMAN SAYA"
          value={peminjamanSayaCount}
          description="Peminjaman sedang aktif"
          badgeText="Sedang Berjalan"
          icon={HiOutlineClipboardList}
          color="green"
          onClick={() => navigate('/peminjaman')}
        />

        {/* C. Menunggu Persetujuan Pinjaman */}
        <StatCard
          title="PERSETUJUAN PINJAMAN"
          value={menungguPersetujuanCount}
          description="Pengajuan pinjaman dalam review"
          badgeText="Pending Pinjam"
          icon={HiOutlineClock}
          color="amber"
          onClick={() => navigate('/peminjaman')}
        />

        {/* D. Menunggu Mutasi */}
        <StatCard
          title="MUTASI MENUNGGU"
          value={menungguMutasiCount}
          description="Pengajuan mutasi dalam review"
          badgeText="Pending Mutasi"
          icon={HiOutlineSwitchHorizontal}
          color="indigo"
          onClick={() => navigate('/mutasi')}
        />
      </div>

      {/* Quick Actions Component */}
      <QuickActions
        onOpenScanModal={() => setIsQrScannerOpen(true)}
        onOpenLoanModal={() => {
          setSelectedAssetForLoan(null);
          setIsLoanModalOpen(true);
        }}
        onOpenMutationModal={() => {
          setSelectedAssetForMutation(null);
          setIsMutationModalOpen(true);
        }}
        onOpenInspectionModal={() => {
          setSelectedAssetForInspection(null);
          setIsInspectionModalOpen(true);
        }}
      />

      {/* Available Assets Table */}
      <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem', maxWidth: '520px', position: 'relative' }}>
        <HiOutlineSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }} />
        <input
          type="search"
          className="form-control"
          aria-label="Cari aset tersedia"
          placeholder="Cari aset tersedia berdasarkan nama atau kode..."
          value={assetSearch}
          onChange={(event) => setAssetSearch(event.target.value)}
          style={{ paddingLeft: '38px', fontSize: '0.875rem' }}
        />
      </div>
      <AssetTable
        assets={availableAssets}
        loading={assetsLoading}
        onSelectAsset={(asset) => {
          setSelectedAssetForLoan(asset);
          setIsLoanModalOpen(true);
        }}
        onViewDetail={(asset) => setSelectedAssetForDetail(asset)}
      />

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

      {/* Recent Activities from dashboard endpoint if available */}
      {dashboardData?.aktivitas_terbaru && dashboardData.aktivitas_terbaru.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem', borderRadius: '12px', border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>
              Aktivitas Operasional Terbaru
            </h2>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/aktivitas')}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Lihat Semua
            </button>
          </div>
          <div style={{ padding: '0 20px' }}>
            {dashboardData.aktivitas_terbaru.slice(0, 5).map((act, i) => (
              <div
                key={act.id || i}
                style={{
                  padding: '12px 0',
                  borderBottom: i < 4 ? '1px solid var(--gray-100)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-900)' }}>
                    {act.aktivitas || act.kegiatan || 'Aktivitas'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                    {act.keterangan || act.catatan || '-'}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                  {act.created_at ? formatDateTime(act.created_at) : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Pengajuan Peminjaman */}
      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => {
          setIsLoanModalOpen(false);
          setSelectedAssetForLoan(null);
        }}
        initialAsset={selectedAssetForLoan}
        onSuccess={() => showToast('Pengajuan peminjaman aset berhasil dikirim! Menunggu persetujuan admin.')}
      />

      {/* Modal Pengajuan Mutasi */}
      <MutationModal
        isOpen={isMutationModalOpen}
        onClose={() => {
          setIsMutationModalOpen(false);
          setSelectedAssetForMutation(null);
        }}
        initialAsset={selectedAssetForMutation}
        onSuccess={() => showToast('Pengajuan mutasi aset berhasil dikirim! Menunggu persetujuan admin.')}
      />

      {/* Modal Pemeriksaan Aset */}
      <InspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setSelectedAssetForInspection(null);
        }}
        initialAsset={selectedAssetForInspection}
        onSuccess={() => showToast('Catatan pemeriksaan fisik aset berhasil disimpan!')}
      />

      {/* Modal Detail Aset */}
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
    </main>
  );
}
