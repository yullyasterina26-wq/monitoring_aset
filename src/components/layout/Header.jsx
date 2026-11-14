import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineChevronDown,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineServer,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineUserCircle,
} from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';
import ServerConfigModal from '../ui/ServerConfigModal';
import AssetDetailModal from '../ui/AssetDetailModal';
import LoanModal from '../ui/LoanModal';
import MutationModal from '../ui/MutationModal';
import InspectionModal from '../ui/InspectionModal';
import NotificationDropdown from '../ui/NotificationDropdown';
import { getApiBaseUrl, getStorageUrl } from '../../services/api';

export default function Header({ collapsed, onToggle, theme, onThemeChange }) {
  const { user, logout, isAdmin, isOperator, roleLabel } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Header quick modals
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState(null);
  const [selectedAssetForLoan, setSelectedAssetForLoan] = useState(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedAssetForMutation, setSelectedAssetForMutation] = useState(null);
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [selectedAssetForInspection, setSelectedAssetForInspection] = useState(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  const [, setActiveBaseUrl] = useState(() => getApiBaseUrl());

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstLetter = (user?.name || 'Operator').charAt(0).toUpperCase();
  const profilePhotoUrl = user?.profile_photo_path ? getStorageUrl(user.profile_photo_path) : '';

  return (
    <>
      <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="header-left">
          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="header-toggle-btn"
            onClick={onToggle}
            aria-label="Buka Menu Navigasi"
            title="Buka Menu Navigasi"
            id="btn-header-toggle"
          >
            <HiOutlineMenu />
          </button>

          <h1 className="header-brand-title">
            SIMA Operator
          </h1>
        </div>

        <div className="header-right">
          {/* Server Config Indicator */}
          <button
            type="button"
            className="btn btn-secondary header-server-btn"
            onClick={() => setIsServerModalOpen(true)}
            title="Pengaturan Server API & LAN"
            id="btn-header-server-config"
          >
            <HiOutlineServer style={{ fontSize: '16px', color: '#16a34a' }} />
            <span className="hide-on-mobile-sm">Server</span>
          </button>

          <div className="theme-switch" role="group" aria-label="Pilih tampilan">
            <button
              type="button"
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              aria-pressed={theme === 'light'}
              onClick={() => onThemeChange('light')}
              title="Light mode"
            >
              <HiOutlineSun aria-hidden="true" />
              <span>Light</span>
            </button>
            <button
              type="button"
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              aria-pressed={theme === 'dark'}
              onClick={() => onThemeChange('dark')}
              title="Dark mode"
            >
              <HiOutlineMoon aria-hidden="true" />
              <span>Dark</span>
            </button>
          </div>

          {/* Notifikasi Aktivitas Peminjaman & Mutasi */}
          <NotificationDropdown />

          {/* Profile Dropdown */}
          <div className="header-user-wrapper" ref={dropdownRef}>
            <button
              className="header-user"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              id="profile-dropdown-btn"
            >
              <div className="header-avatar">
                {profilePhotoUrl ? <img src={profilePhotoUrl} alt="" /> : firstLetter}
              </div>

              <div className="user-info hide-on-mobile-sm">
                <div className="user-info-name">
                  {user?.name || 'Operator'}
                </div>
                <div className="user-info-role">
                  {roleLabel}
                </div>
              </div>

              <HiOutlineChevronDown
                className="header-chevron hide-on-mobile-sm"
                style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                }}
              />
            </button>

            {dropdownOpen && (
              <div
                className="user-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '220px',
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--gray-200)',
                  padding: '6px 0',
                  zIndex: 1000,
                }}
              >
                <div style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Masuk Sebagai</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                    {user?.name || 'Operator'}
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#2563eb', fontWeight: 600, textTransform: 'capitalize' }}>
                    Role: {roleLabel}
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    {user?.email || '-'}
                  </p>
                </div>

                <div style={{ padding: '4px 6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/profil');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--gray-700)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <HiOutlineUserCircle style={{ fontSize: '15px', color: 'var(--primary-600)' }} />
                    <span>Profil Saya</span>
                  </button>
                  {!isOperator && <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setIsServerModalOpen(true);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--gray-700)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <HiOutlineServer style={{ fontSize: '15px', color: '#16a34a' }} />
                    <span>Pengaturan Server API</span>
                  </button>}
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      if (window.confirm('Keluar dari sesi akun Anda?')) {
                        logout?.();
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    id="btn-logout"
                  >
                    <HiOutlineLogout style={{ fontSize: '15px' }} />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Modals from Header */}
      <ServerConfigModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        onSaved={(url) => setActiveBaseUrl(url)}
      />

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

      <LoanModal
        isOpen={!isAdmin && isLoanModalOpen}
        onClose={() => {
          setIsLoanModalOpen(false);
          setSelectedAssetForLoan(null);
        }}
        initialAsset={selectedAssetForLoan}
      />

      <MutationModal
        isOpen={!isAdmin && isMutationModalOpen}
        onClose={() => {
          setIsMutationModalOpen(false);
          setSelectedAssetForMutation(null);
        }}
        initialAsset={selectedAssetForMutation}
      />

      <InspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setSelectedAssetForInspection(null);
        }}
        initialAsset={selectedAssetForInspection}
      />
    </>
  );
}
