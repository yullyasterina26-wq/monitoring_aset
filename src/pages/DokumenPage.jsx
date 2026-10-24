import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineDownload,
  HiOutlineMail,
  HiOutlineMailOpen,
  HiOutlineClipboardList,
} from 'react-icons/hi';
import Header from '../components/layout/Header';
import {
  Loading,
  EmptyState,
  Badge,
  Pagination,
  formatDate,
} from '../components/ui/Shared';
import api from '../services/api';

export default function DokumenPage() {
  const { collapsed, toggleSidebar } = useOutletContext();

  const [activeTab, setActiveTab] = useState('bast'); // 'bast' | 'surat_masuk' | 'surat_keluar'
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  // Filters
  const [search, setSearch] = useState('');
  const [jenisBast, setJenisBast] = useState('');
  const [page, setPage] = useState(1);

  // Selected document detail modal
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [letterPreviewUrl, setLetterPreviewUrl] = useState('');
  const [openingLetter, setOpeningLetter] = useState(false);

  const fetchDocuments = (pageNum = 1) => {
    setLoading(true);
    let endpoint = '/operasional/dokumen/bast';
    const params = {
      page: pageNum,
      search: search || undefined,
    };

    if (activeTab === 'bast') {
      endpoint = '/operasional/dokumen/bast';
      if (jenisBast) params.jenis = jenisBast;
    } else if (activeTab === 'surat_masuk') {
      endpoint = '/operasional/dokumen/surat-masuk';
    } else if (activeTab === 'surat_keluar') {
      endpoint = '/operasional/dokumen/surat-keluar';
    }

    api.get(endpoint, { params })
      .then(res => {
        setDataList(res.data.data || []);
        setPagination({
          currentPage: res.data.current_page,
          lastPage: res.data.last_page,
          total: res.data.total,
          from: res.data.from || 0,
          to: res.data.to || 0,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
    fetchDocuments(1);
  }, [activeTab, jenisBast]);

  useEffect(() => {
    fetchDocuments(page);
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments(1);
  };

  const viewFinalLetter = async (item) => {
    setOpeningLetter(true);
    try {
      const response = await api.get(`/operasional/dokumen/bast/${item.bast_id}/final`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      setLetterPreviewUrl(previous => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
      setSelectedDoc({ type: 'surat_masuk', data: item });
    } catch (error) {
      console.error('Gagal membuka surat balasan BAST:', error);
      window.alert('Surat balasan belum tersedia atau tidak dapat dibuka. Muat ulang daftar dan coba lagi.');
    } finally {
      setOpeningLetter(false);
    }
  };

  const closeDocument = () => {
    setSelectedDoc(null);
    setLetterPreviewUrl(previous => {
      if (previous) URL.revokeObjectURL(previous);
      return '';
    });
  };

  const getStatusBadge = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'disetujui' || s === 'approved' || s === 'selesai') return 'success';
    if (s === 'menunggu' || s === 'pending' || s === 'diproses') return 'warning';
    if (s === 'ditolak' || s === 'rejected' || s === 'dibatalkan') return 'danger';
    return 'default';
  };

  return (
    <>
      <Header
        collapsed={collapsed}
        onToggle={toggleSidebar}
        title="Surat & Dokumen Operasional"
        subtitle="Akses dokumen Berita Acara (BAST), Surat Masuk, & Surat Keluar aset"
      />

      <main className="main-content page-enter">
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button
            className={`btn ${activeTab === 'bast' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('bast');
              setSearch('');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <HiOutlineClipboardList /> Berita Acara Serah Terima (BAST)
          </button>
          <button
            className={`btn ${activeTab === 'surat_masuk' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('surat_masuk');
              setSearch('');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <HiOutlineMail /> Surat Masuk
          </button>
          <button
            className={`btn ${activeTab === 'surat_keluar' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('surat_keluar');
              setSearch('');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <HiOutlineMailOpen /> Surat Keluar
          </button>
        </div>

        {/* Filter Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <form onSubmit={handleSearchSubmit} className="filter-form">
              <div className="filter-grid">
                <div className="form-group" style={{ flex: '2', minWidth: '220px' }}>
                  <label htmlFor="search-doc">Pencarian Dokumen</label>
                  <div className="input-with-icon">
                    <HiOutlineSearch className="input-icon" />
                    <input
                      id="search-doc"
                      type="text"
                      className="form-control"
                      placeholder={
                        activeTab === 'bast'
                          ? 'Cari nomor BAST atau perihal...'
                          : 'Cari nomor surat atau perihal...'
                      }
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {activeTab === 'bast' && (
                  <div className="form-group" style={{ flex: '1', minWidth: '180px' }}>
                    <label htmlFor="filter-jenis-bast">Jenis BAST</label>
                    <select
                      id="filter-jenis-bast"
                      className="form-control"
                      value={jenisBast}
                      onChange={e => setJenisBast(e.target.value)}
                    >
                      <option value="">Semua Jenis BAST</option>
                      <option value="Peminjaman">Peminjaman</option>
                      <option value="Pengembalian">Pengembalian</option>
                      <option value="Penghapusan">Penghapusan</option>
                      <option value="Mutasi">Mutasi</option>
                    </select>
                  </div>
                )}

                <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">
                    <HiOutlineFilter /> Cari
                  </button>
                  {(search || jenisBast) && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setSearch('');
                        setJenisBast('');
                        setPage(1);
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Document List Table */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HiOutlineDocumentText style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }} />
              <h2>
                {activeTab === 'bast'
                  ? `Daftar BAST (${pagination.total || 0})`
                  : activeTab === 'surat_masuk'
                  ? `Daftar Surat Masuk (${pagination.total || 0})`
                  : `Daftar Surat Keluar (${pagination.total || 0})`}
              </h2>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
              Akses khusus baca untuk operator
            </span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <Loading message="Mengambil dokumen..." />
            ) : dataList.length === 0 ? (
              <EmptyState message="Tidak ada dokumen yang ditemukan." />
            ) : activeTab === 'bast' ? (
              /* Table BAST */
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Nomor BAST</th>
                      <th>Jenis BAST</th>
                      <th>Tanggal</th>
                      <th>Pihak Pertama</th>
                      <th>Pihak Kedua</th>
                      <th>Status Dokumen</th>
                      <th>Aset Terkait</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataList.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                          {item.nomor_bast}
                        </td>
                        <td>
                          <Badge type="info">{item.jenis_bast}</Badge>
                        </td>
                        <td>{formatDate(item.tanggal_bast)}</td>
                        <td>{item.pihak_pertama_nama || '-'}</td>
                        <td>{item.pihak_kedua_nama || '-'}</td>
                        <td>
                          <Badge type={getStatusBadge(item.status)}>{item.status_label || item.status}</Badge>
                        </td>
                        <td>
                          {item.assets && item.assets.length > 0 ? (
                            <span style={{ fontSize: '0.85rem' }}>
                              {item.assets.map(a => a.kode_aset).join(', ')}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--gray-400)' }}>-</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                            onClick={() => setSelectedDoc({ type: 'bast', data: item })}
                          >
                            <HiOutlineEye /> Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Table Surat Masuk / Surat Keluar */
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Nomor Surat</th>
                      <th>Tanggal Surat</th>
                      <th>{activeTab === 'surat_masuk' ? 'Pengirim' : 'Tujuan'}</th>
                      <th>Perihal</th>
                      <th>File Dokumen</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataList.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                          {item.nomor_surat}
                        </td>
                        <td>{formatDate(item.tanggal_surat)}</td>
                        <td>
                          {activeTab === 'surat_masuk'
                            ? item.pengirim || '-'
                            : item.tujuan || item.kepada || '-'}
                        </td>
                        <td style={{ maxWidth: '280px', fontWeight: 500 }}>{item.perihal}</td>
                        <td>
                          {activeTab === 'surat_masuk' ? (
                            item.dokumen_tersedia ? (
                              <button
                                type="button"
                                onClick={() => viewFinalLetter(item)}
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                disabled={openingLetter}
                              >
                                <HiOutlineEye /> {openingLetter ? 'Membuka...' : 'Lihat Surat'}
                              </button>
                            ) : (
                              <Badge type="warning">PDF belum diunggah</Badge>
                            )
                          ) : item.file_surat || item.file_path ? (
                            <a
                              href={`/storage/${item.file_surat || item.file_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              <HiOutlineDownload /> Unduh
                            </a>
                          ) : (
                            <span style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>-</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                            onClick={() => setSelectedDoc({ type: activeTab, data: item })}
                          >
                            <HiOutlineEye /> Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ padding: '0 1.25rem 1rem' }}>
            <Pagination
              currentPage={pagination.currentPage}
              lastPage={pagination.lastPage}
              total={pagination.total}
              from={pagination.from}
              to={pagination.to}
              onPageChange={p => setPage(p)}
            />
          </div>
        </div>
      </main>

      {/* Document Detail Modal */}
      {selectedDoc && (
        <div className="modal-backdrop" onClick={closeDocument}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HiOutlineDocumentText style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }} />
                <h3>
                  Detail {selectedDoc.type === 'bast' ? 'BAST' : selectedDoc.type === 'surat_masuk' ? 'Surat Masuk' : 'Surat Keluar'}
                </h3>
              </div>
              <button className="modal-close" onClick={closeDocument}>
                <HiOutlineX />
              </button>
            </div>

            <div className="modal-body">
              {selectedDoc.type === 'bast' ? (
                <div className="info-grid-simple">
                  <div className="info-item">
                    <span className="info-label">Nomor Dokumen BAST</span>
                    <span className="info-value" style={{ fontWeight: 600 }}>{selectedDoc.data.nomor_bast}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Jenis Berita Acara</span>
                    <span className="info-value"><Badge type="info">{selectedDoc.data.jenis_bast}</Badge></span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Tanggal Pelaksanaan</span>
                    <span className="info-value">{formatDate(selectedDoc.data.tanggal_bast)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Status Verifikasi</span>
                    <span className="info-value"><Badge type={getStatusBadge(selectedDoc.data.status)}>{selectedDoc.data.status}</Badge></span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Pihak Pertama (Penyerah)</span>
                    <span className="info-value">{selectedDoc.data.pihak_pertama_nama || '-'} ({selectedDoc.data.pihak_pertama_jabatan || '-'})</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Pihak Kedua (Penerima)</span>
                    <span className="info-value">{selectedDoc.data.pihak_kedua_nama || '-'} ({selectedDoc.data.pihak_kedua_jabatan || '-'})</span>
                  </div>

                  {selectedDoc.data.keterangan && (
                    <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                      <span className="info-label">Catatan BAST:</span>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{selectedDoc.data.keterangan}</p>
                    </div>
                  )}

                  {/* Assets list in BAST */}
                  {selectedDoc.data.assets && selectedDoc.data.assets.length > 0 && (
                    <div style={{ gridColumn: 'span 2', marginTop: '1rem', borderTop: '1px solid var(--gray-200)', paddingTop: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Daftar Aset yang Tercantum dalam Dokumen</h4>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                        {selectedDoc.data.assets.map(a => (
                          <li key={a.id} style={{ marginBottom: '0.25rem' }}>
                            <strong>{a.kode_aset}</strong> - {a.nama_aset}
                            {a.pivot?.kondisi_sesudah && (
                              <span style={{ color: 'var(--gray-500)', marginLeft: '0.5rem' }}>
                                (Kondisi: {a.pivot.kondisi_sesudah})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="info-grid-simple">
                  <div className="info-item">
                    <span className="info-label">Nomor Surat</span>
                    <span className="info-value" style={{ fontWeight: 600 }}>{selectedDoc.data.nomor_surat}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Tanggal Surat</span>
                    <span className="info-value">{formatDate(selectedDoc.data.tanggal_surat)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">{selectedDoc.type === 'surat_masuk' ? 'Pengirim' : 'Tujuan Surat'}</span>
                    <span className="info-value">{selectedDoc.data.pengirim || selectedDoc.data.tujuan || '-'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Perihal</span>
                    <span className="info-value">{selectedDoc.data.perihal}</span>
                  </div>

                  {selectedDoc.data.ringkasan && (
                    <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                      <span className="info-label">Ringkasan Isi Surat:</span>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{selectedDoc.data.ringkasan}</p>
                    </div>
                  )}
                  {selectedDoc.type === 'surat_masuk' && (
                    <div style={{ gridColumn: 'span 2', marginTop: '0.75rem' }}>
                      <span className="info-label">Tanggal diterima</span>
                      <p style={{ margin: '0.25rem 0 0' }}>{formatDate(selectedDoc.data.received_at || selectedDoc.data.tanggal_surat)}</p>
                      {letterPreviewUrl ? (
                        <iframe
                          title={`Surat balasan ${selectedDoc.data.nomor_surat}`}
                          src={letterPreviewUrl}
                          style={{ width: '100%', height: '65vh', marginTop: '0.75rem', border: '1px solid var(--gray-200)', borderRadius: '8px' }}
                        />
                      ) : (
                        <p style={{ marginTop: '0.75rem', color: 'var(--gray-500)' }}>PDF surat belum tersedia.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDocument}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
