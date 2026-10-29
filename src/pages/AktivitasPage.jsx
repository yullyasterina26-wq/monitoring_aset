import { useState, useEffect } from 'react';
import {
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineInbox,
  HiOutlineCube,
} from 'react-icons/hi';
import { Loading, Badge, Pagination, formatDateTime } from '../components/ui/Shared';
import api from '../services/api';
import useDebouncedValue from '../hooks/useDebouncedValue';

export default function AktivitasPage() {
  const [activeTab, setActiveTab] = useState('operasional'); // 'operasional' | 'me'

  // Tab 1: Riwayat Aset Operasional (/operasional/aktivitas)
  const [operasionalList, setOperasionalList] = useState([]);
  const [opLoading, setOpLoading] = useState(true);
  const [opPagination, setOpPagination] = useState({ total: 0, from: 0, to: 0, currentPage: 1, lastPage: 1 });
  const [opSearch, setOpSearch] = useState('');
  const debouncedOpSearch = useDebouncedValue(opSearch);
  const [opPage, setOpPage] = useState(1);

  // Tab 2: Aktivitas Akun Sendiri (/me/activities)
  const [meList, setMeList] = useState([]);
  const [meLoading, setMeLoading] = useState(true);
  const [mePagination, setMePagination] = useState({ total: 0, from: 0, to: 0, currentPage: 1, lastPage: 1 });
  const [mePage, setMePage] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Fetch Operasional Activities
  const fetchOperasional = (pageNum = 1) => {
    setOpLoading(true);
    api.get('/operasional/aktivitas', {
      params: {
        page: pageNum,
        search: debouncedOpSearch || undefined,
        per_page: 12,
      },
    })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setOperasionalList(list);
        if (res.data?.current_page) {
          setOpPagination({
            currentPage: res.data.current_page,
            lastPage: res.data.last_page,
            total: res.data.total || 0,
            from: res.data.from || 0,
            to: res.data.to || 0,
          });
        } else {
          setOpPagination({
            currentPage: 1,
            lastPage: 1,
            total: list.length,
            from: list.length > 0 ? 1 : 0,
            to: list.length,
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching operasional activities:', err);
      })
      .finally(() => setOpLoading(false));
  };

  // Fetch User Account Activities
  const fetchMeActivities = (pageNum = 1) => {
    setMeLoading(true);
    api.get('/me/activities', {
      params: {
        page: pageNum,
        per_page: 15,
      },
    })
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setMeList(list);
        if (res.data?.current_page) {
          setMePagination({
            currentPage: res.data.current_page,
            lastPage: res.data.last_page,
            total: res.data.total || 0,
            from: res.data.from || 0,
            to: res.data.to || 0,
          });
        } else {
          setMePagination({
            currentPage: 1,
            lastPage: 1,
            total: list.length,
            from: list.length > 0 ? 1 : 0,
            to: list.length,
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching me activities:', err);
      })
      .finally(() => setMeLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'operasional') {
      fetchOperasional(opPage);
    } else {
      fetchMeActivities(mePage);
    }
  }, [activeTab, opPage, mePage, debouncedOpSearch]);

  const handleOpReset = () => {
    setOpSearch('');
    setOpPage(1);
  };

  return (
    <main className="main-content page-enter" style={{ padding: '24px 28px', maxWidth: '1440px' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <HiOutlineClock style={{ fontSize: '1.5rem', color: 'var(--primary-600)' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-900)', margin: 0 }}>
            Riwayat Aktivitas
          </h1>
        </div>
        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
          Log aktivitas akun Anda dan rekam jejak operasional aset di lapangan.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--gray-200)',
          marginBottom: '1.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('operasional')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontWeight: activeTab === 'operasional' ? 700 : 500,
            color: activeTab === 'operasional' ? 'var(--primary-700)' : 'var(--gray-600)',
            borderBottom: activeTab === 'operasional' ? '2px solid var(--primary-600)' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <HiOutlineCube />
          <span>Riwayat Aset Operasional</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('me')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontWeight: activeTab === 'me' ? 700 : 500,
            color: activeTab === 'me' ? 'var(--primary-700)' : 'var(--gray-600)',
            borderBottom: activeTab === 'me' ? '2px solid var(--primary-600)' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <HiOutlineUser />
          <span>Aktivitas Akun Saya</span>
        </button>
      </div>

      {/* TAB 1: OPERASIONAL ASSETS ACTIVITY */}
      {activeTab === 'operasional' && (
        <div>
          {/* Search Bar */}
          <div
            className="card"
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              border: '1px solid var(--gray-200)',
            }}
          >
            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <HiOutlineSearch
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--gray-400)',
                    fontSize: '18px',
                  }}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari aktivitas, aset, kode, keterangan, atau petugas..."
                  value={opSearch}
                  onChange={(e) => { setOpSearch(e.target.value); setOpPage(1); }}
                  style={{ paddingLeft: '38px', fontSize: '0.875rem' }}
                />
              </div>

              {opSearch && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleOpReset}
                  style={{ fontSize: '0.85rem' }}
                >
                  <HiOutlineRefresh />
                </button>
              )}
            </form>
          </div>

          {/* Activity List */}
          <div className="card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
            {opLoading ? (
              <div style={{ padding: '3rem' }}>
                <Loading text="Memuat riwayat aset operasional..." />
              </div>
            ) : operasionalList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <HiOutlineInbox style={{ fontSize: '44px', color: 'var(--gray-300)', margin: '0 auto 8px' }} />
                <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                  Belum ada log riwayat operasional aset.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                      <th>Waktu</th>
                      <th>Aktivitas</th>
                      <th>Aset Terkait</th>
                      <th>Keterangan / Perubahan</th>
                      <th>Petugas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operasionalList.map((item, idx) => (
                      <tr key={item.id || idx} onClick={() => setSelectedActivity({ item, type: 'Aktivitas Operasional' })} style={{ cursor: 'pointer' }} title="Klik baris untuk melihat detail aktivitas">
                        <td style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                          {(opPagination.from || 1) + idx}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                          {item.created_at ? formatDateTime(item.created_at) : (item.tanggal || '-')}
                        </td>
                        <td>
                          <Badge type="info">
                            {item.aktivitas || item.jenis || item.kegiatan || 'Operasional'}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.85rem' }}>
                            {item.aset?.nama_aset || item.nama_aset || (item.aset_id ? `Aset #${item.aset_id}` : '-')}
                          </div>
                          {item.aset?.kode_aset && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                              {item.aset.kode_aset}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray-700)', maxWidth: '360px' }}>
                          {item.keterangan || item.deskripsi || '-'}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                          {item.petugas || item.user?.name || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {opPagination.lastPage > 1 && (
              <div style={{ padding: '12px 18px', borderTop: '1px solid var(--gray-100)' }}>
                <Pagination
                  currentPage={opPagination.currentPage}
                  lastPage={opPagination.lastPage}
                  onPageChange={(p) => setOpPage(p)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY ACCOUNT ACTIVITIES */}
      {activeTab === 'me' && (
        <div className="card" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
          {meLoading ? (
            <div style={{ padding: '3rem' }}>
              <Loading text="Memuat aktivitas akun Anda..." />
            </div>
          ) : meList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <HiOutlineInbox style={{ fontSize: '44px', color: 'var(--gray-300)', margin: '0 auto 8px' }} />
              <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                Belum ada catatan aktivitas untuk akun Anda.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                    <th>Waktu</th>
                    <th>Tindakan / Event</th>
                    <th>Detail Aktivitas</th>
                    <th>Alamat IP / Klien</th>
                  </tr>
                </thead>
                <tbody>
                  {meList.map((act, idx) => (
                    <tr key={act.id || idx} onClick={() => setSelectedActivity({ item: act, type: 'Aktivitas Akun' })} style={{ cursor: 'pointer' }} title="Klik baris untuk melihat detail aktivitas">
                      <td style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                        {(mePagination.from || 1) + idx}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {act.created_at ? formatDateTime(act.created_at) : '-'}
                      </td>
                      <td>
                        <Badge type="default">{act.action || act.aktivitas || 'Aktivitas Akun'}</Badge>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>
                        {act.description || act.keterangan || '-'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                        {act.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {mePagination.lastPage > 1 && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--gray-100)' }}>
              <Pagination
                currentPage={mePagination.currentPage}
                lastPage={mePagination.lastPage}
                onPageChange={(p) => setMePage(p)}
              />
            </div>
          )}
        </div>
      )}
      {selectedActivity && (
        <div className="modal-backdrop" onClick={() => setSelectedActivity(null)} style={{ zIndex: 1060 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '92%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{selectedActivity.type}</h3>
              <button className="modal-close" onClick={() => setSelectedActivity(null)} aria-label="Tutup"><span aria-hidden="true">×</span></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: '12px', fontSize: '0.9rem' }}>
              <div><strong>Aktivitas</strong><div>{selectedActivity.item.aktivitas || selectedActivity.item.action || selectedActivity.item.jenis || selectedActivity.item.kegiatan || '-'}</div></div>
              <div><strong>Waktu</strong><div>{selectedActivity.item.created_at ? formatDateTime(selectedActivity.item.created_at) : '-'}</div></div>
              <div><strong>Petugas</strong><div>{selectedActivity.item.petugas || selectedActivity.item.user?.name || selectedActivity.item.actor_name || '-'}</div></div>
              <div><strong>Keterangan</strong><div>{selectedActivity.item.keterangan || selectedActivity.item.deskripsi || selectedActivity.item.description || '-'}</div></div>
              {selectedActivity.item.ip_address && <div><strong>Alamat IP / Klien</strong><div>{selectedActivity.item.ip_address}</div></div>}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setSelectedActivity(null)}>Tutup</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
