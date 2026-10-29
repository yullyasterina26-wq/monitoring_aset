import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineSwitchHorizontal,
  HiOutlineClipboardCheck,
} from 'react-icons/hi';
import { MdHandshake } from 'react-icons/md';
import DataSyncWatcher from './DataSyncWatcher';

export default function AppLayout({ theme, onThemeChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    if (window.innerWidth <= 900) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  const isNavActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-layout">
      <DataSyncWatcher />
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`main-wrapper ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header collapsed={collapsed} onToggle={toggleSidebar} theme={theme} onThemeChange={onThemeChange} />
        <Outlet context={{ collapsed, toggleSidebar }} />
      </div>

      {/* Floating Bottom Navbar for Mobile Phones */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/" className={`mobile-bottom-item ${isNavActive('/') ? 'active' : ''}`} title="Dashboard">
          <HiOutlineViewGrid className="icon" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/aset" className={`mobile-bottom-item ${isNavActive('/aset') ? 'active' : ''}`} title="Aset">
          <HiOutlineCube className="icon" />
          <span>Aset</span>
        </NavLink>
        <NavLink to="/peminjaman" className={`mobile-bottom-item ${isNavActive('/peminjaman') ? 'active' : ''}`} title="Pinjam">
          <MdHandshake className="icon" />
          <span>Pinjam</span>
        </NavLink>
        <NavLink to="/mutasi" className={`mobile-bottom-item ${isNavActive('/mutasi') ? 'active' : ''}`} title="Mutasi">
          <HiOutlineSwitchHorizontal className="icon" />
          <span>Mutasi</span>
        </NavLink>
        <NavLink to="/pemeriksaan" className={`mobile-bottom-item ${isNavActive('/pemeriksaan') ? 'active' : ''}`} title="Periksa">
          <HiOutlineClipboardCheck className="icon" />
          <span>Periksa</span>
        </NavLink>
      </nav>
    </div>
  );
}
