import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineUserCircle,
  HiOutlineCog,
  HiOutlineCube,
  HiOutlineClipboardList,
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineChevronDown,
  HiOutlineCheck,
  HiOutlineSwitchHorizontal,
  HiOutlineSearch,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineQrcode,
  HiOutlineArrowRight,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import StatCard from '../components/ui/StatCard';
import QuickActions from '../components/ui/QuickActions';
import AssetTable from '../components/ui/AssetTable';
import LoanModal from '../components/ui/LoanModal';
import MutationModal from '../components/ui/MutationModal';
import InspectionModal from '../components/ui/InspectionModal';
import DeletionModal from '../components/ui/DeletionModal';
import AssetDetailModal from '../components/ui/AssetDetailModal';
import QrScannerModal from '../components/ui/QrScannerModal';
import api from '../services/api';
import { formatDateTime } from '../components/ui/Shared';
import useDebouncedValue from '../hooks/useDebouncedValue';

const CONDITION_CHART_COLORS = {
  Baik: '#22c55e',
  'Di Pinjam': '#3b82f6',
  Rusak: '#ef4444',
  Maintenance: '#f59e0b',
  'Dalam Pemeliharaan': '#f59e0b',
  'Di Hapus': '#64748b',
};
const FALLBACK_CHART_COLORS = ['#6366f1', '#14b8a6', '#f97316', '#a855f7', '#0ea5e9'];

function getConditionChartColor(name, index) {
  return CONDITION_CHART_COLORS[name] || FALLBACK_CHART_COLORS[index % FALLBACK_CHART_COLORS.length];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin, canManageAssets, canApprove } = useAuth();
  const showAvailableAssetsTable = isAdmin || (canManageAssets && !canApprove);

  // Dynamic Greeting & Date
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Stats state
  const [dashboardData, setDashboardData] = useState(null);
  const [asetTersediaCount, setAsetTersediaCount] = useState(0);
  const [peminjamanSayaCount, setPeminjamanSayaCount] = useState(0);
  const [pemeriksaanCount, setPemeriksaanCount] = useState(0);
  const [menungguPersetujuanCount, setMenungguPersetujuanCount] = useState(0);
  const [menungguPeminjamanCount, setMenungguPeminjamanCount] = useState(0);
  const [menungguMutasiCount, setMenungguMutasiCount] = useState(0);
  const [menungguPemeriksaanCount, setMenungguPemeriksaanCount] = useState(0);
  const [menungguPemeriksaanBaikCount, setMenungguPemeriksaanBaikCount] = useState(0);
  const [menungguPemeriksaanRusakRinganCount, setMenungguPemeriksaanRusakRinganCount] = useState(0);
  const [menungguPemeriksaanRusakBeratCount, setMenungguPemeriksaanRusakBeratCount] = useState(0);
  const [menungguPenghapusanCount, setMenungguPenghapusanCount] = useState(0);
  const [, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [dashboardSummaryLoading, setDashboardSummaryLoading] = useState(true);
  const [dashboardSummaryError, setDashboardSummaryError] = useState('');

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
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [selectedAssetForDeletion, setSelectedAssetForDeletion] = useState(null);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState(null);

  const [toastMessage, setToastMessage] = useState('');
  const [isApprovalMenuOpen, setIsApprovalMenuOpen] = useState(false);
  const approvalMenuRef = useRef(null);
  const statsGridRef = useRef(null);

  const scrollStatsCards = (direction) => {
    const grid = statsGridRef.current;
    const firstCard = grid?.firstElementChild;
    if (!grid || !firstCard) return;

    const gap = Number.parseFloat(window.getComputedStyle(grid).columnGap) || 0;
    grid.scrollBy({ left: direction * (firstCard.getBoundingClientRect().width + gap), behavior: 'smooth' });
  };

  useEffect(() => {
    if (showAvailableAssetsTable) return undefined;

    const grid = statsGridRef.current;
    if (!grid || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let pointerPaused = false;
    let focusPaused = false;
    const pauseForPointer = () => { pointerPaused = true; };
    const resumeFromPointer = () => { pointerPaused = false; };
    const pauseForFocus = () => { focusPaused = true; };
    const resumeFromFocus = (event) => {
      if (!grid.contains(event.relatedTarget)) focusPaused = false;
    };

    grid.addEventListener('pointerenter', pauseForPointer);
    grid.addEventListener('pointerleave', resumeFromPointer);
    grid.addEventListener('focusin', pauseForFocus);
    grid.addEventListener('focusout', resumeFromFocus);

    const interval = window.setInterval(() => {
      if (pointerPaused || focusPaused || grid.scrollWidth <= grid.clientWidth + 1) return;

      const end = grid.scrollWidth - grid.clientWidth;
      if (grid.scrollLeft >= end - 8) {
        grid.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }

      const firstCard = grid.firstElementChild;
      const gap = Number.parseFloat(window.getComputedStyle(grid).columnGap) || 0;
      grid.scrollBy({
        left: (firstCard?.getBoundingClientRect().width || grid.clientWidth) + gap,
        behavior: 'smooth',
      });
    }, 3500);

    return () => {
      window.clearInterval(interval);
      grid.removeEventListener('pointerenter', pauseForPointer);
      grid.removeEventListener('pointerleave', resumeFromPointer);
      grid.removeEventListener('focusin', pauseForFocus);
      grid.removeEventListener('focusout', resumeFromFocus);
    };
  }, [showAvailableAssetsTable]);

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    setStatsLoading(true);
    setStatsError('');
    setDashboardSummaryLoading(true);
    setDashboardSummaryError('');

    if (canManageAssets && !canApprove) {
      try {
        const response = await api.get('/dashboard');
        setDashboardData(response.data || null);
      } catch (error) {
        console.error('Gagal memuat ringkasan aset:', error);
        setStatsError('Ringkasan Dashboard gagal dimuat. Coba muat ulang halaman.');
      } finally {
        setDashboardSummaryLoading(false);
        setStatsLoading(false);
      }
      return;
    }

    // 1. Fetch summary from /operasional/dashboard
    try {
      const dashRes = await api.get('/operasional/dashboard');
      setDashboardData(dashRes.data || null);
    } catch (dashErr) {
      console.warn('Dashboard summary endpoint fetch:', dashErr);
      setDashboardSummaryError('Ringkasan kondisi aset tidak dapat dimuat. Periksa koneksi API, lalu coba lagi.');
    } finally {
      setDashboardSummaryLoading(false);
    }

    const fetchCount = async (path, params, label) => {
      try {
        const response = await api.get(path, { params: { ...params, per_page: 1 } });
        const total = response.data?.requests?.total ?? response.data?.total;
        if (typeof total !== 'number') {
          throw new Error('Respons server tidak menyertakan jumlah total.');
        }
        return total;
      } catch (error) {
        const detail = error.response?.data?.message
          || (error.response?.status ? `HTTP ${error.response.status}` : error.message)
          || 'Koneksi ke server gagal.';
        console.error(`Gagal memuat jumlah ${label}:`, error);
        throw new Error(`${label}: ${detail}`, { cause: error });
      }
    };

    const fetchLoanStats = async () => {
      try {
        const { data } = await api.get('/loans/statistics', { timeout: 30000 });
        const statuses = ['menunggu', 'diproses', 'dipinjam', 'terlambat'];
        if (statuses.some((status) => typeof data?.[status] !== 'number')) {
          throw new Error('Respons server tidak menyertakan jumlah peminjaman.');
        }
        return data;
      } catch (error) {
        const detail = error.response?.data?.message
          || (error.response?.status ? `HTTP ${error.response.status}` : error.message)
          || 'Koneksi ke server gagal.';
        console.error('Gagal memuat jumlah peminjaman:', error);
        throw new Error(`peminjaman: ${detail}`, { cause: error });
      }
    };

    const fetchInspectionStats = async () => {
      try {
        const { data } = await api.get('/operasional/pemeriksaan/statistics', { timeout: 30000 });
        const keys = ['total', 'menunggu', 'menunggu_baik', 'menunggu_rusak_ringan', 'menunggu_rusak_berat'];
        if (keys.some((key) => typeof data?.[key] !== 'number')) {
          throw new Error('Respons server tidak menyertakan jumlah pemeriksaan.');
        }
        return data;
      } catch (error) {
        const detail = error.response?.data?.message
          || (error.response?.status ? `HTTP ${error.response.status}` : error.message)
          || 'Koneksi ke server gagal.';
        console.error('Gagal memuat jumlah pemeriksaan:', error);
        throw new Error(`pemeriksaan: ${detail}`, { cause: error });
      }
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
        const totals = [all, pending, approved, processing, completed].map(({ data }) => data?.total ?? 0);
        return {
          total: totals[0],
          menunggu: totals[1],
          disetujui: totals[2] + totals[3],
          selesai: totals[4],
        };
      } catch (error) {
        console.warn('Gagal memuat statistik mutasi:', error);
        return { total: 0, menunggu: 0, disetujui: 0, selesai: 0 };
      }
    };

    const countRequests = [
      fetchLoanStats(),
      fetchMutationStats(),
      fetchInspectionStats(),
      fetchCount('/asset-deletion-requests', { status: 'Menunggu Persetujuan' }, 'penghapusan menunggu'),
    ];

    try {
      const [
        peminjamanStats,
        mutasiStats,
        pemeriksaanStats,
        penghapusanMenunggu,
      ] = await Promise.all(countRequests);

      setPeminjamanSayaCount(peminjamanStats.diproses + peminjamanStats.dipinjam + peminjamanStats.terlambat);
      setPemeriksaanCount(pemeriksaanStats.total);
      setMenungguPeminjamanCount(peminjamanStats.menunggu);
      setMenungguMutasiCount(mutasiStats.menunggu);
      setMenungguPemeriksaanCount(pemeriksaanStats.menunggu);
      setMenungguPemeriksaanBaikCount(pemeriksaanStats.menunggu_baik);
      setMenungguPemeriksaanRusakRinganCount(pemeriksaanStats.menunggu_rusak_ringan);
      setMenungguPemeriksaanRusakBeratCount(pemeriksaanStats.menunggu_rusak_berat);
      setMenungguPenghapusanCount(penghapusanMenunggu);
      setMenungguPersetujuanCount(
        peminjamanStats.menunggu + mutasiStats.menunggu + pemeriksaanStats.menunggu + penghapusanMenunggu,
      );
    } catch (error) {
      console.error('Gagal memuat jumlah pengajuan Dashboard:', error);
      setStatsError(`Jumlah pengajuan gagal diperbarui. ${error.message}`);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAvailableAssets = async (search = '') => {
    setAssetsLoading(true);
    try {
      const assetRes = await api.get('/assets', {
        params: { kondisi: 'Baik', per_page: showAvailableAssetsTable ? 8 : 1, search: search || undefined },
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
      } else if (action === 'deletion') {
        setSelectedAssetForDeletion(asset);
        setIsDeletionModalOpen(true);
      }
    } catch (error) {
      console.warn('Konteks tindakan sebelum login tidak dapat dibaca:', error);
    }
  }, []);

  useEffect(() => {
    if (!isApprovalMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (!approvalMenuRef.current?.contains(event.target)) setIsApprovalMenuOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsApprovalMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isApprovalMenuOpen]);

  useEffect(() => {
    fetchAvailableAssets(debouncedAssetSearch);
  }, [debouncedAssetSearch]);

  const showToast = (msg) => {
    setToastMessage(msg);
    fetchDashboardData();
    fetchAvailableAssets(debouncedAssetSearch);
    setTimeout(() => setToastMessage(''), 5000);
  };

  const conditionSummary = Array.isArray(dashboardData?.rekap_kondisi) && dashboardData.rekap_kondisi.length > 0
    ? dashboardData.rekap_kondisi
    : [
        { kondisi: 'Baik', jumlah: dashboardData?.aset_baik },
        { kondisi: 'Di Pinjam', jumlah: dashboardData?.aset_dipinjam },
        { kondisi: 'Rusak', jumlah: dashboardData?.aset_rusak },
        { kondisi: 'Maintenance', jumlah: dashboardData?.aset_maintenance },
        { kondisi: 'Di Hapus', jumlah: dashboardData?.aset_dihapus },
      ];
  const conditionChartData = conditionSummary
    .map(({ kondisi, jumlah }) => ({ name: kondisi, value: Number(jumlah) }))
    .filter((item) => item.value > 0);
  const totalConditionAssets = conditionChartData.reduce((total, item) => total + item.value, 0);
  const chartGradient = conditionChartData.reduce((gradient, item, index) => {
    const end = gradient.offset + (item.value / totalConditionAssets) * 100;
    return {
      offset: end,
      stops: [...gradient.stops, `${getConditionChartColor(item.name, index)} ${gradient.offset}% ${end}%`],
    };
  }, { offset: 0, stops: [] }).stops.join(', ');

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
      {statsError && <div className="alert alert-danger" role="alert" style={{ marginBottom: '1.25rem' }}>{statsError}</div>}

      {/* Hero Welcome Banner */}
      <div className="dashboard-hero-banner">
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-tag">
            <HiOutlineSparkles className="dashboard-hero-tag-icon" />
            <span>PORTAL OPERASIONAL ASET • BANDARA SUPADIO</span>
          </div>
          <h1 className="dashboard-hero-title">
            {getGreeting()},{' '}
            <span className="dashboard-hero-name">
              {user?.name || (canManageAssets && !canApprove ? 'Pengelola Aset' : 'Petugas Operasional')}
            </span>{' '}
            👋
          </h1>
          <p className="dashboard-hero-subtitle">
            {canManageAssets && !canApprove
              ? 'Pantau ringkasan inventaris, ketersediaan, dan kondisi fisik aset secara real-time.'
              : 'Pusat pemantauan sirkulasi aset, mutasi unit kerja, pencatatan inspeksi berkala, serta perizinan operasional bandara.'}
          </p>
        </div>
        <div className="dashboard-hero-meta">
          <div className="dashboard-hero-status-pill">
            <span className="dashboard-hero-status-dot" />
            <span>Sistem Operasional Aktif</span>
          </div>
          <div className="dashboard-hero-date-pill">
            <HiOutlineCalendar />
            <span>{todayFormatted}</span>
          </div>
          <button
            type="button"
            className="dashboard-hero-cta-btn"
            onClick={() => setIsQrScannerOpen(true)}
            id="btn-hero-scan-qr"
          >
            <HiOutlineQrcode style={{ fontSize: '18px' }} />
            <span>Pindai QR Aset</span>
          </button>
        </div>
      </div>


      {/* Operational summary cards */}
      <section ref={approvalMenuRef} className="dashboard-stats-carousel" aria-label="Ringkasan operasional">
        {!(canManageAssets && !canApprove) && (
          <div className="dashboard-stats-controls">
            <span>Ringkasan operasional</span>
            <div>
              <button type="button" aria-label="Geser kartu ke kiri" onClick={() => scrollStatsCards(-1)}>
                <HiOutlineArrowRight aria-hidden="true" style={{ transform: 'rotate(180deg)' }} />
              </button>
              <button type="button" aria-label="Geser kartu ke kanan" onClick={() => scrollStatsCards(1)}>
                <HiOutlineArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      <div
        ref={statsGridRef}
        className={`stats-grid dashboard-stats-grid${showAvailableAssetsTable ? '' : ' dashboard-stats-grid--operator'}`}
      >
        {canManageAssets && !canApprove ? (
          <>
            <StatCard
              title="TOTAL ASET"
              value={dashboardData?.total_aset || 0}
              description="Seluruh inventaris terdaftar"
              badgeText="Data Inventaris"
              icon={HiOutlineCube}
              color="blue"
              onClick={() => navigate('/aset')}
            />
            <StatCard
              title="ASET TERSEDIA"
              value={dashboardData?.aset_baik || 0}
              description="Aset berkondisi baik"
              badgeText="Siap Digunakan"
              icon={HiOutlineCheck}
              color="green"
              onClick={() => navigate('/aset')}
            />
          </>
        ) : (
          <>
            <StatCard
              title="ASET TERSEDIA"
              value={asetTersediaCount}
              description="Kondisi baik & siap dipinjam"
              badgeText="Siap Digunakan"
              icon={HiOutlineCube}
              color="blue"
              onClick={() => navigate('/aset')}
            />
            <StatCard
              title="PEMINJAMAN"
              value={peminjamanSayaCount}
              description="Peminjaman sedang aktif"
              badgeText="Sedang Berjalan"
              icon={HiOutlineClipboardList}
              color="green"
              onClick={() => navigate('/peminjaman')}
            />
            <StatCard
              title="MUTASI MENUNGGU"
              value={menungguMutasiCount}
              description="Pengajuan mutasi dalam review"
              badgeText="Pending Mutasi"
              icon={HiOutlineSwitchHorizontal}
              color="indigo"
              onClick={() => navigate('/mutasi')}
            />
            <StatCard
              title="PEMERIKSAAN"
              value={pemeriksaanCount}
              description="Total catatan pemeriksaan aset"
              badgeText="Total Catatan"
              icon={HiOutlineClipboardCheck}
              color="purple"
              onClick={() => navigate('/pemeriksaan')}
            />
            <StatCard
              title="PENGHAPUSAN"
              value={menungguPenghapusanCount}
              description="Pengajuan penghapusan menunggu"
              badgeText="Menunggu"
              icon={HiOutlineTrash}
              color="amber"
              onClick={() => navigate('/penghapusan')}
            />
            <div className="approval-menu-wrapper">
              <StatCard
                title="MENUNGGU PERSETUJUAN"
                value={menungguPersetujuanCount}
                description="Klik untuk melihat rincian pengajuan"
                badgeText="Lihat Rincian"
                icon={HiOutlineClock}
                color="rose"
                onClick={() => setIsApprovalMenuOpen((isOpen) => !isOpen)}
              />
            </div>
          </>
        )}
      </div>
      {isApprovalMenuOpen && !(canManageAssets && !canApprove) && (
        <div className="approval-dropdown-menu approval-dropdown-menu--carousel" role="menu" aria-label="Jenis pengajuan menunggu persetujuan">
          {[
            { label: 'Peminjaman', count: menungguPeminjamanCount, path: '/peminjaman', icon: HiOutlineClipboardList },
            { label: 'Mutasi', count: menungguMutasiCount, path: '/mutasi', icon: HiOutlineSwitchHorizontal },
            { label: 'Pemeriksaan', count: menungguPemeriksaanCount, detail: `Baik ${menungguPemeriksaanBaikCount} · Rusak Ringan ${menungguPemeriksaanRusakRinganCount} · Rusak Berat ${menungguPemeriksaanRusakBeratCount}`, path: '/pemeriksaan', icon: HiOutlineClipboardCheck },
            { label: 'Penghapusan', count: menungguPenghapusanCount, path: '/penghapusan', icon: HiOutlineTrash },
          ].map(({ label, count, detail, path, icon: MenuIcon }) => (
            <button
              key={path}
              type="button"
              role="menuitem"
              onClick={() => {
                setIsApprovalMenuOpen(false);
                navigate(path);
              }}
              className="approval-dropdown-item"
            >
              <MenuIcon aria-hidden="true" />
              <span>
                <span>{label}</span>
                {detail && <small>{detail}</small>}
              </span>
              <strong>{count.toLocaleString('id-ID')}</strong>
              <HiOutlineChevronDown aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      </section>

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
        onOpenDeletionModal={() => setIsDeletionModalOpen(true)}
      />


      {showAvailableAssetsTable ? (
        <>
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
            onSelectAsset={!isAdmin ? (asset) => {
              setSelectedAssetForLoan(asset);
              setIsLoanModalOpen(true);
            } : undefined}
            onViewDetail={(asset) => setSelectedAssetForDetail(asset)}
          />
        </>
      ) : (
        <section className="card dashboard-condition-card" aria-labelledby="dashboard-condition-title">
          <header className="dashboard-condition-header">
            <div>
              <h2 id="dashboard-condition-title">Ringkasan Kondisi Aset</h2>
              <p>Komposisi seluruh aset berdasarkan kondisi terkini.</p>
            </div>
          </header>
          {dashboardSummaryLoading ? (
            <p className="dashboard-condition-empty">Memuat diagram kondisi aset...</p>
          ) : dashboardSummaryError ? (
            <div className="dashboard-condition-status" role="alert">
              <p>{dashboardSummaryError}</p>
              <button type="button" className="btn btn-secondary" onClick={fetchDashboardData}>
                Coba Lagi
              </button>
            </div>
          ) : conditionChartData.length > 0 ? (
            <div className="dashboard-condition-layout">
              <div className="dashboard-condition-chart" role="img" aria-label="Diagram kondisi aset">
                <div
                  className="dashboard-condition-donut"
                  style={{ background: `conic-gradient(from -90deg, ${chartGradient})` }}
                />
                <div className="dashboard-condition-center" aria-hidden="true">
                  <strong>{totalConditionAssets.toLocaleString('id-ID')}</strong>
                  <span>Total Aset</span>
                </div>
              </div>
              <div className="dashboard-condition-legend" aria-label="Rincian kondisi aset">
                {conditionChartData.map((item, index) => (
                  <div className="dashboard-condition-legend-item" key={item.name}>
                    <span
                      className="dashboard-condition-dot"
                      style={{
                        backgroundColor: getConditionChartColor(item.name, index),
                      }}
                    />
                    <span className="dashboard-condition-name">{item.name}</span>
                    <strong>{item.value.toLocaleString('id-ID')}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="dashboard-condition-empty">Data kondisi aset belum tersedia.</p>
          )}
        </section>
      )}

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onViewDetail={(asset) => setSelectedAssetForDetail(asset)}
        onSelectAssetForLoan={!isAdmin ? (asset) => {
          setSelectedAssetForLoan(asset);
          setIsLoanModalOpen(true);
        } : undefined}
        onSelectAssetForMutation={!isAdmin ? (asset) => {
          setSelectedAssetForMutation(asset);
          setIsMutationModalOpen(true);
        } : undefined}
        onSelectAssetForInspection={(asset) => {
          setSelectedAssetForInspection(asset);
          setIsInspectionModalOpen(true);
        }}
        onSelectAssetForDeletion={!isAdmin ? (asset) => {
          setSelectedAssetForDeletion(asset);
          setIsDeletionModalOpen(true);
        } : undefined}
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
        isOpen={!isAdmin && isLoanModalOpen}
        onClose={() => {
          setIsLoanModalOpen(false);
          setSelectedAssetForLoan(null);
        }}
        initialAsset={selectedAssetForLoan}
        onSuccess={() => showToast('Pengajuan peminjaman aset berhasil dikirim! Menunggu persetujuan admin.')}
      />

      {/* Modal Pengajuan Mutasi */}
      <MutationModal
        isOpen={!isAdmin && isMutationModalOpen}
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

      <DeletionModal
        isOpen={!isAdmin && isDeletionModalOpen}
        onClose={() => {
          setIsDeletionModalOpen(false);
          setSelectedAssetForDeletion(null);
        }}
        initialAsset={selectedAssetForDeletion}
        onSuccess={() => showToast('Pengajuan penghapusan aset berhasil dikirim!')}
      />

      {/* Modal Detail Aset */}
      <AssetDetailModal
        asset={selectedAssetForDetail}
        onClose={() => setSelectedAssetForDetail(null)}
        onPinjam={!isAdmin ? (asset) => {
          setSelectedAssetForLoan(asset);
          setIsLoanModalOpen(true);
        } : undefined}
        onMutasi={!isAdmin ? (asset) => {
          setSelectedAssetForMutation(asset);
          setIsMutationModalOpen(true);
        } : undefined}
        onPemeriksaan={(asset) => {
          setSelectedAssetForInspection(asset);
          setIsInspectionModalOpen(true);
        }}
      />
    </main>
  );
}
