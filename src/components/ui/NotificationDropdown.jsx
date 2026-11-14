import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineClipboardCheck,
  HiOutlineSwitchHorizontal,
  HiOutlineTrash,
} from 'react-icons/hi';
import { MdHandshake } from 'react-icons/md';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from './Shared';

export default function NotificationDropdown() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => JSON.parse(localStorage.getItem('read_notifications') || '[]'));
  const [serverUnreadCount, setServerUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('semua');
  const [loading, setLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');

  const dropdownRef = useRef(null);
  const notificationRequestInFlight = useRef(false);
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;
  const unreadNotifications = notifications.filter((item) => !item.serverReadAt && !readIds.includes(item.id));
  const unreadCount = serverUnreadCount + unreadNotifications.filter((item) => !item.serverId).length;
  const unreadCountsByType = unreadNotifications.reduce((counts, item) => {
    counts[item.type] = (counts[item.type] || 0) + 1;
    return counts;
  }, {});

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
  const fetchNotifications = useCallback(async ({ includeTransactions = false } = {}) => {
    if (!isAuthenticated) return;
    if (notificationRequestInFlight.current) return;
    notificationRequestInFlight.current = true;
    setLoading(true);
    setNotificationError('');

    try {
      const [loanRes, mutRes, inspectionRes, deletionRes, notificationRes] = await Promise.all([
        includeTransactions ? api.get('/loans', { params: { per_page: 50 } }).catch(() => ({ data: [] })) : { data: [] },
        includeTransactions ? api.get('/mutations', { params: { per_page: 50 } }).catch(() => ({ data: [] })) : { data: [] },
        includeTransactions ? api.get('/operasional/pemeriksaan', { params: { per_page: 50 } }).catch(() => ({ data: [] })) : { data: [] },
        includeTransactions ? api.get('/asset-deletion-requests', { params: { per_page: 50 } }).catch(() => ({ data: { requests: { data: [] } } })) : { data: { requests: { data: [] } } },
        api.get('/notifications'),
      ]);

      const loanList = loanRes.data?.data || loanRes.data || [];
      const mutList = mutRes.data?.data || mutRes.data || [];
      const inspectionList = inspectionRes.data?.data || inspectionRes.data || [];
      const deletionList = deletionRes.data?.requests?.data || [];

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
          } else {
            title = 'Peminjaman Sedang Berjalan';
            message = `Aset ${assetName} (${assetCode}) aktif dipinjam (tanpa batas tanggal kembali).`;
            badgeType = 'info';
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

      inspectionList.forEach((inspection) => {
        const assetName = inspection.aset?.nama_aset || `Aset #${inspection.aset_id}`;
        const assetCode = inspection.aset?.kode_aset || '';
        const condition = inspection.kondisi_baru || inspection.kondisi;
        const details = [
          condition ? `Kondisi hasil: ${condition}.` : '',
          inspection.keterangan ? `Keterangan: ${inspection.keterangan}` : '',
        ].filter(Boolean).join(' ');

        items.push({
          id: `inspection_${inspection.id}_Selesai`,
          type: 'pemeriksaan',
          title: 'Pemeriksaan aset dicatat',
          message: `Pemeriksaan ${assetName} (${assetCode}) telah dicatat.${details ? ` ${details}` : ''}`,
          badgeText: 'Selesai',
          badgeType: 'success',
          priority: 'normal',
          timestamp: inspection.updated_at || inspection.created_at,
          link: '/pemeriksaan',
          entityType: 'inspection',
          entityId: inspection.id,
          status: 'Selesai',
        });
      });

      deletionList.forEach((deletion) => {
        const assetName = deletion.aset?.nama_aset || `Aset #${deletion.aset_id}`;
        const assetCode = deletion.aset?.kode_aset || '';
        const details = [
          deletion.tempat_pembuangan ? `Tempat pembuangan: ${deletion.tempat_pembuangan}.` : '',
          deletion.alasan ? `Alasan: ${deletion.alasan}` : '',
        ].filter(Boolean).join(' ');

        items.push({
          id: `deletion_${deletion.id}_${deletion.status}`,
          type: 'penghapusan',
          title: 'Pengajuan penghapusan aset',
          message: `Pengajuan penghapusan ${assetName} (${assetCode})${details ? `. ${details}` : ''}`,
          badgeText: deletion.status || 'Menunggu',
          badgeType: deletion.status === 'Ditolak' ? 'danger' : deletion.status === 'Disetujui' ? 'success' : 'warning',
          priority: 'normal',
          timestamp: deletion.updated_at || deletion.created_at,
          link: '/penghapusan',
          entityType: 'asset_deletion',
          entityId: deletion.id,
          status: deletion.status || 'Menunggu',
        });
      });

      const serverItems = (notificationRes.data?.notifications || []).map((notification) => {
        const data = notification.data || {};
        const module = String(data.module || '').toLowerCase();
        const title = data.title || '';
        const type = module === 'loans' ? 'peminjaman'
          : module === 'mutations' ? 'mutasi'
            : ['asset_deletion', 'deletions'].includes(module) ? 'penghapusan'
              : module === 'bast' ? 'bast'
                : module === 'inspections' || (module === 'assets' && /pemeriksaan/i.test(title)) ? 'pemeriksaan' : 'lainnya';
        const link = type === 'peminjaman' ? '/peminjaman'
          : type === 'mutasi' ? '/mutasi'
            : type === 'penghapusan' ? '/penghapusan'
              : type === 'bast' ? '/dokumen'
                : type === 'pemeriksaan' ? '/pemeriksaan' : '';

        return {
          id: `db_${notification.id}`,
          serverId: notification.id,
          entityType: data.entity_type,
          entityId: data.entity_id,
          status: data.status,
          type,
          title: data.title || 'Notifikasi transaksi',
          message: [data.actor, data.description].filter(Boolean).join(' — '),
          badgeText: data.status || 'Transaksi',
          badgeType: /ditolak|batal|perbaikan/i.test(title) ? 'danger' : 'success',
          priority: 'high',
          timestamp: notification.created_at,
          link,
          serverReadAt: notification.read_at,
        };
      });

      const persistedTransactions = new Set(serverItems
        .filter((item) => item.entityType && item.entityId && item.status)
        .map((item) => `${item.entityType}_${item.entityId}_${item.status}`));
      const fallbackItems = items.filter((item) => {
        const match = item.id.match(/^(loan|mut|inspection|deletion)_(\d+)_(.+)$/);
        if (!match) return true;
        const entity = {
          loan: 'loan',
          mut: 'mutation',
          inspection: 'inspection',
          deletion: 'asset_deletion',
        }[match[1]];
        return !persistedTransactions.has(`${entity}_${match[2]}_${match[3]}`);
      });
      items.splice(0, items.length, ...fallbackItems, ...serverItems);

      if (!includeTransactions) {
        const currentTransactionItems = notificationsRef.current.filter((item) =>
          /^(loan|mut|inspection|deletion)_/.test(item.id),
        );
        const currentIds = new Set(items.map((item) => item.id));
        items.push(...currentTransactionItems.filter((item) => !currentIds.has(item.id)));
      }

      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

      setNotifications(items);
      setReadIds(readIds);
      setServerUnreadCount(notificationRes.data?.unread_count
        ?? serverItems.filter((item) => !item.serverReadAt).length);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
      setNotificationError(err.response?.data?.message || 'Notifikasi gagal dimuat. Periksa koneksi lalu coba lagi.');
    } finally {
      notificationRequestInFlight.current = false;
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    // Poll transaction notices and refresh immediately when the user returns to the app.
    const interval = setInterval(fetchNotifications, 20000);
    window.addEventListener('focus', fetchNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchNotifications);
    };
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    const allIds = [...new Set([...readIds, ...notifications.map((n) => n.id)])];
    localStorage.setItem('read_notifications', JSON.stringify(allIds));
    setReadIds(allIds);
    setServerUnreadCount(0);
    setNotificationError('');
    try {
      await api.post('/notifications/read-all');
    } catch (err) {
      setNotificationError(err.response?.data?.message || 'Notifikasi gagal ditandai sudah dibaca.');
      fetchNotifications();
    }
  };

  const handleItemClick = async (item) => {
    const isUnread = !item.serverReadAt && !readIds.includes(item.id);
    if (isUnread) {
      const updatedReadIds = [...readIds, item.id];
      localStorage.setItem('read_notifications', JSON.stringify(updatedReadIds));
      setReadIds(updatedReadIds);
      if (item.serverId) {
        setServerUnreadCount((count) => Math.max(0, count - 1));
        setNotificationError('');
        try {
          await api.post(`/notifications/${item.serverId}/read`);
        } catch (err) {
          const restoredReadIds = updatedReadIds.filter((id) => id !== item.id);
          localStorage.setItem('read_notifications', JSON.stringify(restoredReadIds));
          setReadIds(restoredReadIds);
          setServerUnreadCount((count) => count + 1);
          setNotificationError(err.response?.data?.message || 'Notifikasi gagal ditandai sudah dibaca.');
          return;
        }
      }
    }
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'peminjaman') return item.type === 'peminjaman';
    if (activeFilter === 'mutasi') return item.type === 'mutasi';
    if (activeFilter === 'pemeriksaan') return item.type === 'pemeriksaan';
    if (activeFilter === 'penghapusan') return item.type === 'penghapusan';
    return true;
  });

  return (
    <div className="header-notification-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        type="button"
        className="btn btn-secondary notification-trigger"
        onClick={() => {
          const willOpen = !isOpen;
          setIsOpen(willOpen);
          if (willOpen) fetchNotifications({ includeTransactions: true });
        }}
        style={{
          position: 'relative',
          padding: '6px 10px',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          borderRadius: '8px',
        }}
        title="Pemberitahuan Aktivitas Operasional"
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
          className="notification-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxWidth: '92vw',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-xl)',
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
            className="notification-header"
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
            className="notification-tabs"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              borderBottom: '1px solid var(--gray-100)',
              padding: '6px 10px',
              background: 'var(--bg-card)',
              gap: '4px',
            }}
          >
            {[
              ['semua', 'Semua'],
              ['peminjaman', 'Pinjam'],
              ['mutasi', 'Mutasi'],
              ['pemeriksaan', 'Periksa'],
              ['penghapusan', 'Hapus'],
            ].map(([filter, label]) => (
              <button
                key={filter}
                type="button"
                className="notification-tab"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
                style={{
                  border: 'none',
                  background: activeFilter === filter ? 'var(--primary-50)' : 'transparent',
                  color: activeFilter === filter ? 'var(--primary-700)' : 'var(--gray-600)',
                  fontWeight: activeFilter === filter ? 700 : 500,
                  fontSize: '0.7rem',
                  padding: '6px 2px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
                {(filter === 'semua' ? unreadCount : unreadCountsByType[filter] || 0) > 0 && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '15px',
                      height: '15px',
                      marginLeft: '3px',
                      padding: '0 4px',
                      borderRadius: '8px',
                      background: activeFilter === filter ? 'var(--primary-600)' : 'var(--primary-100)',
                      color: activeFilter === filter ? '#ffffff' : 'var(--primary-700)',
                      fontSize: '9px',
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {filter === 'semua' ? unreadCount : unreadCountsByType[filter]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {notificationError && (
            <div role="alert" style={{ padding: '8px 12px', color: '#b91c1c', background: '#fef2f2', fontSize: '0.75rem' }}>
              {notificationError}
            </div>
          )}

          {/* Notification List Body */}
          <div className="notification-list" style={{ overflowY: 'auto', flex: 1, padding: '4px 0', background: 'var(--bg-card)' }}>
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
                  Belum ada aktivitas pada pilihan ini.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isUnread = !item.serverReadAt && !readIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`notification-item ${isUnread ? 'unread' : ''}`}
                    onClick={() => handleItemClick(item)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--gray-100)',
                      cursor: 'pointer',
                      background: isUnread ? 'var(--primary-50)' : 'var(--bg-card)',
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
                        background:
                          item.type === 'peminjaman' ? '#dbeafe'
                            : item.type === 'mutasi' ? '#fef3c7'
                              : item.type === 'pemeriksaan' ? '#dcfce7'
                                : item.type === 'penghapusan' ? '#fee2e2' : '#e0f2fe',
                        color:
                          item.type === 'peminjaman' ? '#1e40af'
                            : item.type === 'mutasi' ? '#b45309'
                              : item.type === 'pemeriksaan' ? '#15803d'
                                : item.type === 'penghapusan' ? '#b91c1c' : '#0369a1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '16px',
                        marginTop: '2px',
                      }}
                    >
                      {item.type === 'peminjaman' ? <MdHandshake />
                        : item.type === 'mutasi' ? <HiOutlineSwitchHorizontal />
                          : item.type === 'pemeriksaan' ? <HiOutlineClipboardCheck />
                            : item.type === 'penghapusan' ? <HiOutlineTrash /> : <HiOutlineBell />}
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
            className="notification-footer"
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
