import { NavLink, useLocation } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineLogout,
  HiOutlineX,
  HiOutlineSwitchHorizontal,
  HiOutlineClipboardCheck,
  HiOutlineTrash,
} from 'react-icons/hi';
import { MdFlight, MdHandshake } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const location = useLocation();
  const { logout, user, isOperator, canApprove, canManageAssets, roleLabel } = useAuth();
  const canUseOperationalPages = isOperator || canApprove;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {mobileOpen && <div className="mobile-overlay" onClick={onCloseMobile} />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Identitas Aplikasi */}
        <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-logo-card">
              <MdFlight />
            </div>
            <div className="brand-text">
              <h2>Monitoring Aset</h2>
              <span>Airport Technology - Supadio</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-mobile"
            onClick={onCloseMobile}
            aria-label="Tutup Menu"
            title="Tutup Menu"
          >
            <HiOutlineX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard */}
          <NavLink
            to="/"
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
            onClick={onCloseMobile}
            title="Dashboard"
            id="nav-dashboard"
          >
            <span className="nav-icon"><HiOutlineViewGrid /></span>
            <span className="nav-text">Dashboard</span>
          </NavLink>

          {/* Bagian ASET */}
          <div className="nav-section-title">ASET &amp; OPERASIONAL</div>
          <NavLink
            to="/aset"
            className={`nav-item ${isActive('/aset') ? 'active' : ''}`}
            onClick={onCloseMobile}
            title="Data Aset"
            id="nav-data-aset"
          >
            <span className="nav-icon"><HiOutlineCube /></span>
            <span className="nav-text">Data Aset</span>
          </NavLink>

          {canUseOperationalPages && <NavLink
            to="/peminjaman"
            className={`nav-item ${isActive('/peminjaman') ? 'active' : ''}`}
            onClick={onCloseMobile}
            title="Peminjaman Aset"
            id="nav-peminjaman"
          >
            <span className="nav-icon"><MdHandshake style={{ fontSize: '18px' }} /></span>
            <span className="nav-text">Peminjaman</span>
          </NavLink>}

          {canUseOperationalPages && <NavLink
            to="/mutasi"
            className={`nav-item ${isActive('/mutasi') ? 'active' : ''}`}
            onClick={onCloseMobile}
            title="Mutasi Aset"
            id="nav-mutasi"
          >
            <span className="nav-icon"><HiOutlineSwitchHorizontal /></span>
            <span className="nav-text">Mutasi Aset</span>
          </NavLink>}

          {canUseOperationalPages && <NavLink
            to="/pemeriksaan"
            className={`nav-item ${isActive('/pemeriksaan') ? 'active' : ''}`}
            onClick={onCloseMobile}
            title="Pemeriksaan Fisik"
            id="nav-pemeriksaan"
          >
            <span className="nav-icon"><HiOutlineClipboardCheck /></span>
            <span className="nav-text">Pemeriksaan Fisik</span>
          </NavLink>}

          {(canUseOperationalPages || canManageAssets) && <NavLink
            to="/penghapusan"
            className={`nav-item ${isActive('/penghapusan') ? 'active' : ''}`}
            onClick={onCloseMobile}
            title="Pengajuan Penghapusan"
            id="nav-penghapusan"
          >
            <span className="nav-icon"><HiOutlineTrash /></span>
            <span className="nav-text">Penghapusan Aset</span>
          </NavLink>}

          {canApprove && <NavLink
            to="/dokumen"
            className={`nav-item ${isActive('/dokumen') ? 'active' : ''}`}
            onClick={onCloseMobile}
            title="Dokumen BAST"
            id="nav-dokumen"
          >
            <span className="nav-icon"><HiOutlineDocumentText /></span>
            <span className="nav-text">Dokumen BAST</span>
          </NavLink>}

          {canUseOperationalPages && <>
          {/* Bagian AKTIVITAS & LAPORAN */}
          <div className="nav-section-title">LOG &amp; LAPORAN</div>
          <NavLink
            to="/aktivitas"
            className={`nav-item ${isActive('/aktivitas') ? 'active' : ''}`}
            onClick={onCloseMobile}
            title="Riwayat Aktivitas"
            id="nav-aktivitas"
          >
            <span className="nav-icon"><HiOutlineClock /></span>
            <span className="nav-text">Riwayat Aktivitas</span>
          </NavLink>

          <NavLink
            to="/laporan"
            className={`nav-item ${isActive('/laporan') ? 'active' : ''}`}
            onClick={onCloseMobile}
            title="Laporan Operasional"
            id="nav-laporan"
          >
            <span className="nav-icon"><HiOutlineDocumentText /></span>
            <span className="nav-text">Laporan</span>
          </NavLink>
          </>}
        </nav>

        {/* User Card & Tombol Keluar di Bagian Bawah */}
        <div className="sidebar-bottom">
          <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--gray-500)', borderTop: '1px solid var(--gray-200)', marginBottom: '8px' }}>
            <div style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Operator'}
            </div>
            <div style={{ textTransform: 'capitalize', color: 'var(--primary-600)', fontSize: '0.7rem' }}>
              Role: {roleLabel}
            </div>
          </div>

          <button
            type="button"
            className="btn-keluar"
            onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
                logout?.();
              }
            }}
            title="Keluar"
            id="btn-sidebar-keluar"
          >
            <span className="nav-icon"><HiOutlineLogout /></span>
            <span className="nav-text">Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
