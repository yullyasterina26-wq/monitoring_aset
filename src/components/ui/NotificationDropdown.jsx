import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBell,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineSwitchHorizontal,
  HiOutlineX,
} from 'react-icons/hi';
import { MdHandshake } from 'react-icons/md';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from './Shared';

export default function NotificationDropdown() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('semua'); // 'semua' | 'peminjaman' | 'mutasi'
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch loans and mutations to build real-time notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);

    try {
      const [loanRes, mutRes] = await Promise.all([
        api.get('/loans', { params: { per_page: 50 } }).catch(() => ({ data: [] })),
        api.get('/mutations', { params: { per_page: 50 } }).catch(() => ({ data: [] })),
      ]);

      const loanList = loanRes.data?.data || loanRes.data || [];
      const mutList = mutRes.data?.data || mutRes.data || [];

      // Stored read notification IDs
      const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');

      const items = [];
      const now = new Date();

      // 1. Process Loans
      loanList.forEach((loan) => {
        const assetName = loan.aset?.nama_aset || loan.nama_aset || `Aset #${loan.aset_id}`;
        const assetCode = loan.aset?.kode_aset || loan.kode_aset || '';

        let title = '';
        let message = '';
        let badgeType = 'info';
        let priority = 'normal';

        if (loan.status === 'Diproses') {
          title = 'Peminjaman Disetujui Admin';
          message = `Pengajuan pinjam ${assetName} (${assetCode}) disetujui. Lengkapi BAST untuk serah terima fisik aset.`;
          badgeType = 'success';
          priority = 'high';
        } else if (loan.status === 'Dipinjam') {
          // Check if due date is near or past
          const returnDate = loan.tanggal_rencana_kembali ? new Date(loan.tanggal_rencana_kembali) : null;
          if (returnDate) {
            const diffDays = Math.ceil((returnDate - now) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
              title = 'Peminjaman Melewati Batas Waktu!';
              message = `Aset ${assetName} (${assetCode}) telah melewati tanggal kembali (${loan.tanggal_rencana_kembali}). Harap segera kembalikan.`;
              badgeType = 'danger';
              priority = 'urgent';
            } else if (diffDays <= 2) {
              title = 'Mendekati Batas Pengembalian';
              message = `Aset ${assetName} (${assetCode}) harus dikembalikan dalam ${diffDays === 0 ? 'hari ini' : `${diffDays} hari lagi`}.`;
              badgeType = 'warning';
              priority = 'high';
            } else {
              title = 'Peminjaman Sedang Berjalan';
              message = `Aset ${assetName} (${assetCode}) aktif dipinjam hingga ${loan.tanggal_rencana_kembali}.`;
              badgeType = 'info';
            }
          }
        } else if (loan.status === 'Menunggu') {
          title = 'Pengajuan Peminjaman Terkirim';
          message = `Pengajuan pinjam untuk ${assetName} (${assetCode}) sedang menunggu verifikasi admin.`;
          badgeType = 'warning';
        } else if (loan.status === 'Selesai') {
          title = 'Peminjaman Selesai';
          message = `Pengembalian aset ${assetName} (${assetCode}) telah diverifikasi oleh admin.`;
          badgeType = 'success';
        } else if (loan.status === 'Ditolak') {
          title = 'Pengajuan Peminjaman Ditolak';
          message = `Pengajuan pinjam untuk ${assetName} (${assetCode}) ditolak oleh admin.`;
          badgeType = 'danger';
        }

        if (title) {
          items.push({
            id: `loan_${loan.id}_${loan.status}`,
            type: 'peminjaman',
            title,
            message,
            badgeText: loan.status,
            badgeType,
            priority,
            timestamp: loan.updated_at || loan.created_at || loan.tanggal_peminjaman,
            link: '/peminjaman',
            raw: loan,
          });
        }
      });

      // 2. Process Mutations
      mutList.forEach((mut) => {
        const assetName = mut.aset?.nama_aset || mut.nama_aset || `Aset #${mut.aset_id}`;
        const assetCode = mut.aset?.kode_aset || mut.kode_aset || '';

        let title = '';
        let message = '';
        let badgeType = 'info';
        let priority = 'normal';

        if (mut.status === 'Disetujui' || mut.status === 'Diproses') {
          title = 'Mutasi Aset Disetujui Admin';
          message = `Pemindahan aset ${assetName} (${assetCode}) ke lokasi ${mut.lokasi_tujuan} telah disetujui.`;
          badgeType = 'success';
          priority = 'high';
        } else if (mut.status === 'Menunggu') {
          title = 'Pengajuan Mutasi Menunggu Review';
          message = `Pengajuan mutasi ${assetName} (${assetCode}) ke ${mut.lokasi_tujuan} menunggu persetujuan admin.`;
          badgeType = 'warning';
        } else if (mut.status === 'Selesai') {
          title = 'Mutasi Aset Telah Selesai';
          message = `Pemindahan aset ${assetName} ke ${mut.lokasi_tujuan} telah rampung dicatat pada sistem utama.`;
          badgeType = 'success';
        } else if (mut.status === 'Ditolak') {
          title = 'Pengajuan Mutasi Ditolak';
          message = `Pengajuan mutasi untuk ${assetName} (${assetCode}) ditolak oleh admin.`;
          badgeType = 'danger';
        }

        if (title) {
          items.push({
            id: `mut_${mut.id}_${mut.status}`,
            type: 'mutasi',
            title,
            message,
            badgeText: mut.status,
            badgeType,
            priority,
            timestamp: mut.updated_at || mut.created_at || mut.tanggal_mutasi,
            link: '/mutasi',
            raw: mut,
          });
        }
      });

      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

      // Calculate unread count
      const unread = items.filter((item) => !readIds.includes(item.id)).length;
      setNotifications(items);
      setUnreadCount(unread);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    // Poll updates every 45 seconds so operator gets live alerts when admin approves
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem('read_notifications', JSON.stringify(allIds));
    setUnreadCount(0);
  };

  const handleItemClick = (item) => {
    // Mark as read
    const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    if (!readIds.includes(item.id)) {
      readIds.push(item.id);
      localStorage.setItem('read_notifications', JSON.stringify(readIds));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'peminjaman') return item.type === 'peminjaman';
    if (activeFilter === 'mutasi') return item.type === 'mutasi';
    return true;
  });

  const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');

  return (
    <div className="header-notification-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: 'relative',
          padding: '6px 10px',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          borderRadius: '8px',
        }}
        title="Pemberitahuan Aktivitas Peminjaman & Mutasi"
        aria-label="Notifikasi Operasional"
        id="btn-header-notification"
      >
        <HiOutlineBell style={{ fontSize: '18px', color: unreadCount > 0 ? '#2563eb' : 'var(--gray-600)' }} />
        <span className="hide-on-mobile-sm">Notifikasi</span>

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxWidth: '92vw',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid var(--gray-200)',
            zIndex: 1100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '480px',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--gray-100)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--gray-50)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiOutlineBell style={{ color: 'var(--primary-600)', fontSize: '18px' }} />
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                Notifikasi Aktivitas
              </h3>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--primary-100)',
                    color: 'var(--primary-700)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-600)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                Tandai dibaca
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--gray-100)',
              padding: '4px 12px',
              background: '#ffffff',
              gap: '6px',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveFilter('semua')}
              style={{
                border: 'none',
                background: activeFilter === 'semua' ? 'var(--primary-50)' : 'transparent',
                color: activeFilter === 'semua' ? 'var(--primary-700)' : 'var(--gray-600)',
                fontWeight: activeFilter === 'semua' ? 700 : 500,
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Semua ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('peminjaman')}
              style={{
                border: 'none',
                background: activeFilter === 'peminjaman' ? 'var(--primary-50)' : 'transparent',
                color: activeFilter === 'peminjaman' ? 'var(--primary-700)' : 'var(--gray-600)',
                fontWeight: activeFilter === 'peminjaman' ? 700 : 500,
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Peminjaman
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('mutasi')}
              style={{
                border: 'none',
                background: activeFilter === 'mutasi' ? 'var(--primary-50)' : 'transparent',
                color: activeFilter === 'mutasi' ? 'var(--primary-700)' : 'var(--gray-600)',
                fontWeight: activeFilter === 'mutasi' ? 700 : 500,
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Mutasi
            </button>
          </div>

          {/* Notification List Body */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                Memuat pembaruan aktivitas...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <HiOutlineCheckCircle style={{ fontSize: '36px', color: '#16a34a', margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-800)' }}>
                  Tidak ada pemberitahuan baru
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  Seluruh status peminjaman dan mutasi telah Anda tinjau.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isUnread = !readIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--gray-100)',
                      cursor: 'pointer',
                      background: isUnread ? '#eff6ff' : '#ffffff',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isUnread) e.currentTarget.style.background = 'var(--gray-50)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isUnread) e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: item.type === 'peminjaman' ? '#dbeafe' : '#fef3c7',
                        color: item.type === 'peminjaman' ? '#1e40af' : '#b45309',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '16px',
                        marginTop: '2px',
                      }}
                    >
                      {item.type === 'peminjaman' ? <MdHandshake /> : <HiOutlineSwitchHorizontal />}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: isUnread ? 700 : 600, color: 'var(--gray-900)' }}>
                          {item.title}
                        </span>
                        {isUnread && (
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: '#2563eb',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>

                      <p
                        style={{
                          margin: '3px 0 6px',
                          fontSize: '0.75rem',
                          color: 'var(--gray-600)',
                          lineHeight: 1.35,
                        }}
                      >
                        {item.message}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background:
                              item.badgeType === 'success'
                                ? '#dcfce7'
                                : item.badgeType === 'danger'
                                ? '#fee2e2'
                                : item.badgeType === 'warning'
                                ? '#fef3c7'
                                : '#e0f2fe',
                            color:
                              item.badgeType === 'success'
                                ? '#15803d'
                                : item.badgeType === 'danger'
                                ? '#b91c1c'
                                : item.badgeType === 'warning'
                                ? '#b45309'
                                : '#0369a1',
                          }}
                        >
                          {item.badgeText}
                        </span>

                        <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>
                          {item.timestamp ? formatDateTime(item.timestamp) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid var(--gray-100)',
              textAlign: 'center',
              background: 'var(--gray-50)',
            }}
          >
            <button
              type="button"
              onClick={fetchNotifications}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-600)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Perbarui Notifikasi Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
