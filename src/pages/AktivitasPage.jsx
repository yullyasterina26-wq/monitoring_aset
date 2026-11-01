import { useEffect, useState } from 'react';
import {
  HiOutlineClock,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineInbox,
  HiOutlineCube,
  HiOutlineUser,
} from 'react-icons/hi';
import { Loading, Pagination, formatDateTime } from '../components/ui/Shared';
import api from '../services/api';
import useDebouncedValue from '../hooks/useDebouncedValue';

const emptyPagination = { total: 0, from: 0, to: 0, currentPage: 1, lastPage: 1 };

export default function AktivitasPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(emptyPagination);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api.get('/me/activity-feed', {
      params: {
        page,
        search: debouncedSearch || undefined,
        per_page: 15,
      },
    })
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data || [];
        setActivities(list);
        setPagination({
          currentPage: res.data?.current_page || 1,
          lastPage: res.data?.last_page || 1,
          total: res.data?.total || 0,
          from: res.data?.from || 0,
          to: res.data?.to || 0,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error fetching account activity feed:', err);
        setError('Gagal memuat aktivitas. Periksa koneksi lalu coba muat ulang.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, debouncedSearch]);

  const resetSearch = () => {
    setSearch('');
    setPage(1);
  };

  const activityName = (activity) => activity.action || 'Aktivitas';
  const activityDescription = (activity) => activity.description || '-';
  const activityTypeLabel = (activity) => activity.activity_type === 'operasional' ? 'Operasional' : 'Akun';
  const activityTypeColor = (activity) => activity.activity_type === 'operasional'
    ? { color: '#075985', background: '#e0f2fe', border: '#bae6fd' }
    : { color: '#6b21a8', background: '#f3e8ff', border: '#e9d5ff' };

  return (
    <main className="main-content page-enter" style={{ padding: '24px 28px', maxWidth: '1440px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <HiOutlineClock style={{ fontSize: '1.5rem', color: 'var(--primary-600)' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', margin: 0 }}>
            Riwayat Aktivitas
          </h1>
        </div>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
          Aktivitas operasional aset dan aktivitas akun Anda dalam satu urutan waktu.
        </p>
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
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '12px', fontSize: '0.78rem', color: 'var(--gray-600)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <HiOutlineCube style={{ color: '#0284c7' }} /> Operasional
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <HiOutlineUser style={{ color: '#9333ea' }} /> Akun
          </span>
        </div>
      </div>

      <div className="card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
        {loading && activities.length === 0 ? (
          <div style={{ padding: '3rem' }}><Loading text="Memuat riwayat aktivitas..." /></div>
        ) : error ? (
          <div className="alert alert-danger" style={{ margin: '1rem' }}>{error}</div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <HiOutlineInbox style={{ fontSize: '44px', color: 'var(--gray-300)', margin: '0 auto 8px' }} />
            <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
              {search ? 'Tidak ada aktivitas yang cocok dengan pencarian.' : 'Belum ada aktivitas yang tercatat untuk akun Anda.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '52px', textAlign: 'center' }}>No</th>
                  <th style={{ minWidth: '145px' }}>Waktu</th>
                  <th style={{ minWidth: '125px' }}>Jenis</th>
                  <th style={{ minWidth: '190px' }}>Aktivitas</th>
                  <th style={{ minWidth: '180px' }}>Aset Terkait</th>
                  <th>Detail</th>
                  <th style={{ minWidth: '125px' }}>IP / Klien</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, index) => {
                  const operational = activity.activity_type === 'operasional';
                  const typeColor = activityTypeColor(activity);
                  return (
                    <tr
                      key={`${activity.activity_type}-${activity.source_id}`}
                      onClick={() => setSelectedActivity(activity)}
                      style={{ cursor: 'pointer', background: operational ? 'rgba(224, 242, 254, 0.28)' : 'rgba(243, 232, 255, 0.2)' }}
                      title="Klik untuk melihat detail aktivitas"
                    >
                      <td style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                        {(pagination.from || 1) + index}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {activity.created_at ? formatDateTime(activity.created_at) : '-'}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 9px', borderRadius: '999px', border: `1px solid ${typeColor.border}`, color: typeColor.color, background: typeColor.background, fontSize: '0.75rem', fontWeight: 700 }}>
                          {operational ? <HiOutlineCube /> : <HiOutlineUser />}
                          {activityTypeLabel(activity)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-800)' }}>{activityName(activity)}</td>
                      <td>
                        {activity.asset_name ? (
                          <>
                            <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.85rem' }}>{activity.asset_name}</div>
                            {activity.asset_code && <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600 }}>{activity.asset_code}</div>}
                          </>
                        ) : <span style={{ color: 'var(--gray-400)' }}>-</span>}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--gray-700)', maxWidth: '420px' }}>{activityDescription(activity)}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{activity.ip_address || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                {selectedActivity.activity_type === 'operasional' ? <HiOutlineCube style={{ color: '#0284c7' }} /> : <HiOutlineUser style={{ color: '#9333ea' }} />}
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Aktivitas {activityTypeLabel(selectedActivity)}</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedActivity(null)} aria-label="Tutup"><span aria-hidden="true">×</span></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '12px', fontSize: '0.9rem' }}>
              <div><strong>Aktivitas</strong><div>{activityName(selectedActivity)}</div></div>
              <div><strong>Waktu</strong><div>{selectedActivity.created_at ? formatDateTime(selectedActivity.created_at) : '-'}</div></div>
              {selectedActivity.asset_name && <div><strong>Aset</strong><div>{selectedActivity.asset_name}{selectedActivity.asset_code ? ` (${selectedActivity.asset_code})` : ''}</div></div>}
              {selectedActivity.module && <div><strong>Modul</strong><div>{selectedActivity.module}</div></div>}
              <div><strong>Keterangan</strong><div>{activityDescription(selectedActivity)}</div></div>
              {selectedActivity.ip_address && <div><strong>Alamat IP / Klien</strong><div>{selectedActivity.ip_address}</div></div>}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setSelectedActivity(null)}>Tutup</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
