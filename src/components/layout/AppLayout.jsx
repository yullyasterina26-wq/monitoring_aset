import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import DataSyncWatcher from './DataSyncWatcher';
import { useAuth } from '../../contexts/AuthContext';

export default function AppLayout({ theme, onThemeChange }) {
  const { isOperator } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleSidebar = () => {
    if (window.innerWidth <= 900) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <div className={`app-layout${isOperator ? ' app-layout--operator' : ''}`}>
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
    </div>
  );
}
