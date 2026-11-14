import { useEffect, useState } from 'react';
import {
  HiOutlineClock,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineInbox,
  HiOutlineUserCircle,
  HiOutlineCube,
  HiOutlineEye,
} from 'react-icons/hi';
import { Loading, Pagination, formatDateTime } from '../components/ui/Shared';
import api from '../services/api';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { useAuth } from '../contexts/AuthContext';

const emptyPagination = { total: 0, from: 0, to: 0, currentPage: 1, lastPage: 1 };

export default function AktivitasPage() {
  const { isOperator } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(emptyPagination);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityType, setActivityType] = useState('aset');
  const endpoint = activityType === 'aset' ? '/operasional/aktivitas' : '/me/activities';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api.get(endpoint, {
      params: {
        page,
        search: debouncedSearch || undefined,
        per_page: 15,
      },
    })
      .then((res) => {
        if (cancelled) return;
        const payload = res.data?.data ?? res.data;
        const list = Array.isArray(payload)
          ? payload
          : payload?.data || payload?.aktivitas || payload?.items || [];
        setActivities(list);
        setPagination({
          currentPage: payload?.current_page || res.data?.current_page || 1,
          lastPage: payload?.last_page || res.data?.last_page || 1,
          total: payload?.total || res.data?.total || list.length,
          from: payload?.from || res.data?.from || (list.length ? 1 : 0),
          to: payload?.to || res.data?.to || list.length,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`Error fetching ${activityType} activities:`, err);
        setError(
          err.response?.data?.message ||
          `Gagal memuat ${activityType === 'aset' ? 'riwayat aset' : 'aktivitas akun'}. Periksa koneksi lalu coba muat ulang.`
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, debouncedSearch, endpoint, activityType]);

  const resetSearch = () => {
    setSearch('');
    setPage(1);
  };

  const activityName = (activity) =>
    activity.action_label || activity.action || activity.aktivitas || activity.kegiatan || activity.jenis || 'Aktivitas';
  const activityDescription = (activity) =>
    activity.description || activity.keterangan || activity.catatan || activity.kegiatan || '-';
  const activityKey = (activity) =>
    activity.source_id || activity.id || `${activity.created_at}-${activityName(activity)}`;
  const activityTime = (activity) => activity.created_at || activity.tanggal || activity.waktu;
  const activityAddress = (activity) => activity.ip_address || activity.petugas || '-';

  return (
    <main className="main-content page-enter" style={{ padding: '24px 28px', maxWidth: '1440px' }}>
      <div className="page-header-row" style={{ marginBottom: '1.5rem' }}>
        <div className="page-header-title-area">
          <div className="page-header-heading">
            <HiOutlineClock className="page-header-icon" style={{ color: 'var(--primary-600)' }} />
            <h1 className="page-header-title">Riwayat Aktivitas</h1>
          </div>
          <p className="page-header-sub">
            Riwayat aset operasional dan aktivitas akun dalam satu urutan waktu.
          </p>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: '8px', padding: '8px', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--gray-200)' }}>
        {[
          { id: 'aset', label: 'Riwayat Aset', icon: <HiOutlineCube /> },
          { id: 'akun', label: 'Aktivitas Akun', icon: <HiOutlineUserCircle /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn ${activityType === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActivityType(tab.id);
              setPage(1);
              setSelectedActivity(null);
            }}
            aria-pressed={activityType === tab.id}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '14px 18px', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--gray-200)' }}>
        <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <HiOutlineSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Cari aktivitas, aset, kode, atau keterangan..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: '38px', fontSize: '0.875rem' }}
            />
          </div>
          {search && (
            <button type="button" className="btn btn-secondary" onClick={resetSearch} style={{ fontSize: '0.85rem' }} aria-label="Hapus pencarian">
              <HiOutlineRefresh />
            </button>
          )}
        </form>
      </div>

      <div className="card page-table-card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
        {loading && activities.length === 0 ? (
          <div style={{ padding: '3rem' }}><Loading text="Memuat riwayat aktivitas..." /></div>
        ) : error ? (
          <div className="alert alert-danger" style={{ margin: '1rem' }}>{error}</div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <HiOutlineInbox style={{ fontSize: '44px', color: 'var(--gray-300)', margin: '0 auto 8px' }} />
            <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
              {search
                ? 'Tidak ada aktivitas yang cocok dengan pencarian.'
                : `Belum ada ${activityType === 'aset' ? 'riwayat aset' : 'aktivitas akun'} yang tercatat.`}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-responsive activity-table-desktop">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '52px', textAlign: 'center' }}>No</th>
                    <th style={{ minWidth: '145px' }}>Waktu</th>
                    <th style={{ minWidth: '190px' }}>Aktivitas</th>
                    <th>Detail</th>
                    <th style={{ minWidth: '125px' }}>IP / Klien</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, index) => {
                    return (
                      <tr
                        key={activityKey(activity)}
                        onClick={() => setSelectedActivity(activity)}
                        style={{ cursor: 'pointer' }}
                        title="Klik untuk melihat detail aktivitas"
                      >
                        <td style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                          {(pagination.from || 1) + index}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                          {activityTime(activity) ? formatDateTime(activityTime(activity)) : '-'}
                        </td>
                        <td style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-800)' }}>{activityName(activity)}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray-700)', maxWidth: '420px' }}>{activityDescription(activity)}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{activityAddress(activity)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (<= 768px) */}
            <div className={`mobile-data-list activity-mobile-list${isOperator ? ' activity-mobile-list--operator' : ''}`} style={{ padding: '12px' }}>
              {activities.map((activity, index) => {
                const itemNumber = (pagination.from || 1) + index;
                if (isOperator) {
                  return (
                    <button
                      key={activityKey(activity)}
                      type="button"
                      className="activity-mobile-summary"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <span className="activity-mobile-summary-icon"><HiOutlineClock /></span>
                      <span className="activity-mobile-summary-copy">
                        <strong>{activityName(activity)}</strong>
                        <small>{activityTime(activity) ? formatDateTime(activityTime(activity)) : `Aktivitas #${itemNumber}`}</small>
                      </span>
                      <HiOutlineEye className="activity-mobile-summary-action" aria-hidden="true" />
                    </button>
                  );
                }

                return (
                  <div
                    key={activityKey(activity)}
                    className="mobile-data-card"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <div className="mobile-data-card-header">
                      <div className="mobile-data-card-id">
                        <span className="mobile-data-card-num">#{itemNumber}</span>
                        <strong className="mobile-data-card-code" style={{ color: 'var(--gray-800)' }}>
                          {activityName(activity)}
                        </strong>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                        {activityTime(activity) ? formatDateTime(activityTime(activity)) : '-'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--gray-700)', lineHeight: 1.4 }}>
                      {activityDescription(activity)}
                    </div>

                    <div className="mobile-data-card-footer" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--gray-100)', paddingTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
                        {activityAddress(activity)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary mobile-data-card-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedActivity(activity);
                        }}
                      >
                        <HiOutlineEye /> Detail
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!loading && !error && pagination.lastPage > 1 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--gray-100)' }}>
            <Pagination currentPage={pagination.currentPage} lastPage={pagination.lastPage} onPageChange={setPage} />
          </div>
        )}
      </div>

      {selectedActivity && (
        <div className="modal-backdrop" onClick={() => setSelectedActivity(null)} style={{ zIndex: 1060 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '92%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Detail Aktivitas</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedActivity(null)} aria-label="Tutup"><span aria-hidden="true">×</span></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '12px', fontSize: '0.9rem' }}>
              <div><strong>Aktivitas</strong><div>{activityName(selectedActivity)}</div></div>
              <div><strong>Waktu</strong><div>{activityTime(selectedActivity) ? formatDateTime(activityTime(selectedActivity)) : '-'}</div></div>
              {selectedActivity.module && <div><strong>Modul</strong><div>{selectedActivity.module}</div></div>}
              <div><strong>Keterangan</strong><div>{activityDescription(selectedActivity)}</div></div>
              {(selectedActivity.ip_address || selectedActivity.petugas) && (
                <div>
                  <strong>{selectedActivity.ip_address ? 'Alamat IP / Klien' : 'Petugas'}</strong>
                  <div>{activityAddress(selectedActivity)}</div>
                </div>
              )}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setSelectedActivity(null)}>Tutup</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
