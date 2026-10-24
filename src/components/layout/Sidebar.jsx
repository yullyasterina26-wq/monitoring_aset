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
} from 'react-icons/hi';
import { MdFlight, MdHandshake } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const location = useLocation();
  const { logout, user } = useAuth();

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
              <h2>Manajemen Aset</h2>
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

          <NavLink
            to="/peminjaman"
            className={`nav-item ${isActive('/peminjaman') ? 'active' : ''}`}
            onClick={onCloseMobile}
            title="Peminjaman Aset"
            id="nav-peminjaman"
          >
            <span className="nav-icon"><MdHandshake style={{ fontSize: '18px' }} /></span>
            <span className="nav-text">Peminjaman</span>
          </NavLink>

          <NavLink
            to="/mutasi"
            className={`nav-item ${isActive('/mutasi') ? 'active' : ''}`}
            onClick={onCloseMobile}
            title="Mutasi Aset"
            id="nav-mutasi"
          >
            <span className="nav-icon"><HiOutlineSwitchHorizontal /></span>
            <span className="nav-text">Mutasi Aset</span>
          </NavLink>

          <NavLink
            to="/pemeriksaan"
            className={`nav-item ${isActive('/pemeriksaan') ? 'active' : ''}`}
            onClick={onCloseMobile}
            title="Pemeriksaan Fisik"
            id="nav-pemeriksaan"
          >
            <span className="nav-icon"><HiOutlineClipboardCheck /></span>
            <span className="nav-text">Pemeriksaan Fisik</span>
          </NavLink>

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
        </nav>

        {/* User Card & Tombol Keluar di Bagian Bawah */}
        <div className="sidebar-bottom">
          <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--gray-500)', borderTop: '1px solid var(--gray-200)', marginBottom: '8px' }}>
            <div style={{ fontWeight: 600, color: 'var(--gray-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Operator'}
            </div>
            <div style={{ textTransform: 'capitalize', color: 'var(--primary-600)', fontSize: '0.7rem' }}>
              Role: {user?.role || 'operator'}
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
