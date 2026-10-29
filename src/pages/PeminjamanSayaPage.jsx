import { useState, useEffect } from 'react';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineInbox,
  HiOutlineEye,
  HiOutlineX,
} from 'react-icons/hi';
import { MdHandshake } from 'react-icons/md';
import { Loading, Badge, Pagination, formatDate, formatDateTime } from '../components/ui/Shared';
import LoanModal from '../components/ui/LoanModal';
import api from '../services/api';
import useDebouncedValue from '../hooks/useDebouncedValue';

const returnDateMonitor = (loan) => {
  if (!loan.tanggal_rencana_kembali) return { label: 'Tanpa Tanggal Kembali', overdue: false };
  if (loan.status !== 'Dipinjam') return null;

  const [year, month, day] = loan.tanggal_rencana_kembali.slice(0, 10).split('-').map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / 86400000);

  if (days < 0) return { label: `Jadwal lewat ${Math.abs(days)} hari`, overdue: true };
  if (days === 0) return { label: 'Jatuh tempo hari ini', overdue: false };
  return { label: `Jatuh tempo dalam ${days} hari`, overdue: false };
};

export default function PeminjamanSayaPage() {
  const [loans, setLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, from: 0, to: 0, currentPage: 1, lastPage: 1 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [letterPreviewUrl, setLetterPreviewUrl] = useState('');
  const [letterLoading, setLetterLoading] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const fetchLoans = (pageNum = 1) => {
    setLoading(true);
    const params = {
      page: pageNum,
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      per_page: 10,
    };

    api.get('/loans', { params })
      .then(res => {
        const list = res.data.data || res.data || [];
        setLoans(list);
        if (res.data.current_page) {
          setPagination({
            currentPage: res.data.current_page,
            lastPage: res.data.last_page,
            total: res.data.total || 0,
            from: res.data.from || 0,
            to: res.data.to || 0,
          });
        } else {
          setPagination({
            currentPage: 1,
            lastPage: 1,
            total: list.length,
            from: list.length > 0 ? 1 : 0,
            to: list.length,
          });
        }
      })
      .catch(err => {
        console.error('Error fetching loans:', err);
      })
      .finally(() => setLoading(false));
  };

  const openLoanLetter = async () => {
    const letter = selectedLoan?.surat_balasan;
    if (!letter?.tersedia || !letter.bast_id) return;
    setLetterLoading(true);
    try {
      const response = await api.get(`/operasional/dokumen/bast/${letter.bast_id}/final`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      setLetterPreviewUrl(previous => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
    } catch (error) {
      console.error('Gagal membuka surat balasan:', error);
      window.alert('Surat balasan tidak dapat dibuka. Muat ulang pengajuan dan coba lagi.');
    } finally {
      setLetterLoading(false);
    }
  };

  const openBastDocument = async () => {
    const bast = selectedLoan?.dokumen_bast;
    if (!bast?.tersedia || !bast.bast_id) return;
    setLetterLoading(true);
    try {
      const response = await api.get(`/operasional/dokumen/bast/${bast.bast_id}/template`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      setLetterPreviewUrl(previous => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
    } catch (error) {
      console.error('Gagal membuka dokumen BAST:', error);
      window.alert('Dokumen BAST tidak dapat dibuka. Muat ulang pengajuan dan coba lagi.');
    } finally {
      setLetterLoading(false);
    }
  };

  const closeLoanDetail = () => {
    setSelectedLoan(null);
    setLetterPreviewUrl(previous => {
      if (previous) URL.revokeObjectURL(previous);
      return '';
    });
  };

  // Also fetch unfiltered loans to accurately calculate the 5 stat cards
  const fetchAllForStats = () => {
    api.get('/loans', { params: { per_page: 50 } })
      .then(res => {
        const list = res.data.data || res.data || [];
        setAllLoans(list);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchLoans(page);
    fetchAllForStats();
  }, [page, statusFilter, debouncedSearch]);

  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  // Stat Card Counts
  const countMenunggu = allLoans.filter(l => l.status === 'Menunggu').length;
  const countDisetujui = allLoans.filter(l => l.status === 'Diproses').length;
  const countSedangDipinjam = allLoans.filter(l => l.status === 'Dipinjam').length;
  const countTanpaTanggalKembali = allLoans.filter(l => l.status === 'Dipinjam' && !l.tanggal_rencana_kembali).length;
  const countSelesai = allLoans.filter(l => l.status === 'Selesai').length;

  const getStatusBadge = (status, statusBast) => {
    if (status === 'Diproses' && statusBast) {
      const color = statusBast === 'Diarsipkan' ? ['#dcfce7', '#166534'] : ['#e0f2fe', '#0369a1'];
      return <span style={{ background: color[0], color: color[1], padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{statusBast}</span>;
    }

    switch (status) {
      case 'Menunggu':
        return <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Menunggu Persetujuan</span>;
      case 'Diproses':
        return <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Disetujui - Menunggu BAST</span>;
      case 'Dipinjam':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Sedang Dipinjam</span>;
      case 'Selesai':
        return <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Selesai</span>;
      case 'Ditolak':
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Ditolak</span>;
      default:
        return <Badge type="default">{status || '-'}</Badge>;
    }
  };

  return (
    <main className="main-content page-enter" style={{ padding: '24px 28px', maxWidth: '1440px' }}>
      {successToast && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          {successToast}
        </div>
      )}

      {/* Header Row matching Screenshot 2 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdHandshake style={{ fontSize: '24px', color: '#1e293b' }} />
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
            Peminjaman Aset
          </h1>
          <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>
            Pengajuan, serah terima BAST, dan pengembalian aset.
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsLoanModalOpen(true)}
          style={{
            background: '#0f223d',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          id="btn-tambah-peminjaman"
        >
          <HiOutlinePlus /> Tambah Peminjaman
        </button>
      </div>

      {/* 5 Stat Cards in a row matching Screenshot 2 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Menunggu Persetujuan */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #eef2f6',
            borderTop: '3px solid #f59e0b',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#d97706' }}>Menunggu Persetujuan</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b', margin: '4px 0 2px' }}>{countMenunggu}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Perlu ditinjau admin</div>
        </div>

        {/* Card 2: Disetujui - Menunggu BAST */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #eef2f6',
            borderTop: '3px solid #3b82f6',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb' }}>Disetujui - Proses BAST</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6', margin: '4px 0 2px' }}>{countDisetujui}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Menunggu BAST disiapkan dan diarsipkan</div>
        </div>

        {/* Card 3: Sedang Dipinjam */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #eef2f6',
            borderTop: '3px solid #06b6d4',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#0284c7' }}>Sedang Dipinjam</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#06b6d4', margin: '4px 0 2px' }}>{countSedangDipinjam}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Pantau jadwal pengembalian pada daftar</div>
        </div>

        {/* Card 4: Loans without a scheduled return date */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #eef2f6',
            borderTop: '3px solid #64748b',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Tanpa Tanggal Kembali</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#64748b', margin: '4px 0 2px' }}>{countTanpaTanggalKembali}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Mengikuti pilihan admin</div>
        </div>

        {/* Card 5: Selesai */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #eef2f6',
            borderTop: '3px solid #10b981',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a' }}>Selesai</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', margin: '4px 0 2px' }}>{countSelesai}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Aset sudah dikembalikan</div>
        </div>
      </div>

      {/* Main Table Card Container */}
      <div
        className="card"
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #eef2f6',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          padding: '20px',
        }}
      >
        {/* Search & Filter Bar matching Screenshot 2 */}
        <form onSubmit={(e) => e.preventDefault()} style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              height: '42px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '13px',
              color: '#334155',
              outline: 'none',
              minWidth: '150px',
            }}
          >
            <option value="">Semua Status</option>
            <option value="Menunggu">Menunggu Persetujuan</option>
            <option value="Diproses">Disetujui - Menunggu BAST</option>
            <option value="Dipinjam">Sedang Dipinjam</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditolak">Ditolak</option>
          </select>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0 14px',
              height: '42px',
              flex: '1',
              minWidth: '260px',
            }}
          >
            <HiOutlineSearch style={{ color: '#94a3b8', fontSize: '18px', marginRight: '10px', flexShrink: 0 }} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nomor, peminjam, unit, nama atau kode aset..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '13px',
                color: '#1e293b',
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleReset}
            style={{
              height: '42px',
              padding: '0 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <HiOutlineRefresh /> Reset
          </button>
        </form>

        {/* Table matching Screenshot 2 (8 columns) */}
        <div className="table-responsive">
          <table className="table" style={{ margin: 0, borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: '#0f223d' }}>
                <th style={{ width: '45px', textAlign: 'center', background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 8px' }}>NO</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px' }}>NOMOR PENGAJUAN</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px' }}>PEMINJAM / UNIT</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px' }}>ASET</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px' }}>TANGGAL PINJAM</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px' }}>RENCANA KEMBALI</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px' }}>STATUS PROSES</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px', textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center' }}>
                    <Loading message="Memuat data peminjaman..." />
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <HiOutlineInbox style={{ fontSize: '38px', color: '#94a3b8', marginBottom: '8px' }} />
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Tidak ada pengajuan peminjaman yang cocok dengan filter.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                loans.map((loan, index) => {
                  const itemNumber = (pagination.from || 1) + index;
                  return (
                      <tr key={loan.id} onClick={() => setSelectedLoan(loan)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} title="Klik baris untuk melihat detail peminjaman">
                      <td style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', padding: '12px 8px' }}>
                        {itemNumber}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f223d', fontSize: '12px', padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {loan.nomor_peminjaman}
                      </td>
                      <td style={{ fontSize: '12px', color: '#334155', padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600 }}>{loan.nama_peminjam}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{loan.unit}</div>
                      </td>
                      <td style={{ fontSize: '12px', color: '#1e293b', padding: '12px 14px' }}>
                        <div style={{ fontWeight: 500 }}>{loan.aset?.nama_aset}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{loan.aset?.kode_aset}</div>
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569', padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {formatDate(loan.tanggal_peminjaman)}
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569', padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {loan.tanggal_rencana_kembali ? formatDate(loan.tanggal_rencana_kembali) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tanpa Tanggal Kembali</span>}
                        {loan.tanggal_rencana_kembali && returnDateMonitor(loan) && <div style={{ color: returnDateMonitor(loan).overdue ? '#dc2626' : '#64748b', fontSize: '11px', marginTop: '3px' }}>{returnDateMonitor(loan).label}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {getStatusBadge(loan.status, loan.status_bast)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 14px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setSelectedLoan(loan)}
                          style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px' }}
                        >
                          <HiOutlineEye /> Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info matching Screenshot 2 */}
        <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
          Menampilkan {pagination.from || 0}–{pagination.to || 0} dari {pagination.total || 0} pengajuan
        </div>

        {pagination.total > 10 && (
          <div style={{ marginTop: '12px' }}>
            <Pagination
              currentPage={pagination.currentPage}
              lastPage={pagination.lastPage}
              total={pagination.total}
              from={pagination.from}
              to={pagination.to}
              onPageChange={p => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* Modal Detail Peminjaman */}
      {selectedLoan && (
        <div className="modal-backdrop" onClick={closeLoanDetail} style={{ zIndex: 1060 }}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', width: '92%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Detail Pengajuan: {selectedLoan.nomor_peminjaman}</h3>
              <button className="modal-close" onClick={closeLoanDetail}>
                <HiOutlineX />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', fontSize: '13px' }}>
              <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Status:</span>
                  <div style={{ marginTop: '3px' }}>{getStatusBadge(selectedLoan.status, selectedLoan.status_bast)}</div>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {formatDateTime(selectedLoan.created_at)}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Aset</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{selectedLoan.aset?.nama_aset}</div>
                <div style={{ fontSize: '12px', color: '#0f223d' }}>Kode: {selectedLoan.aset?.kode_aset}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px', marginBottom: '12px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Peminjam:</span>
                  <div style={{ fontWeight: 600 }}>{selectedLoan.nama_peminjam}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Unit:</span>
                  <div style={{ fontWeight: 600 }}>{selectedLoan.unit}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Tanggal Pinjam:</span>
                  <div style={{ fontWeight: 600 }}>{formatDate(selectedLoan.tanggal_peminjaman)}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Rencana Kembali:</span>
                  <div style={{ fontWeight: 600 }}>{selectedLoan.tanggal_rencana_kembali ? formatDate(selectedLoan.tanggal_rencana_kembali) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tanpa Tanggal Kembali</span>}</div>
                  {selectedLoan.tanggal_rencana_kembali && returnDateMonitor(selectedLoan) && <small style={{ color: returnDateMonitor(selectedLoan).overdue ? '#dc2626' : '#64748b' }}>{returnDateMonitor(selectedLoan).label}</small>}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '11px' }}>Keperluan:</span>
                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '4px', marginTop: '2px', color: '#334155' }}>
                  {selectedLoan.keperluan}
                </div>
              </div>
              {selectedLoan.dokumen_bast?.tersedia && (
                <div style={{ marginTop: '14px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Dokumen BAST</div>
                  <div style={{ color: '#64748b', marginBottom: '8px' }}>{selectedLoan.dokumen_bast.nomor_bast}</div>
                  <button type="button" className="btn btn-primary" onClick={openBastDocument} disabled={letterLoading}>
                    <HiOutlineEye /> {letterLoading ? 'Membuka dokumen...' : 'Lihat Dokumen BAST'}
                  </button>
                </div>
              )}
              {selectedLoan.surat_balasan && (
                <div style={{ marginTop: '14px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Surat balasan operasional</div>
                  <div style={{ color: '#64748b', marginBottom: '8px' }}>
                    Diterima dari {selectedLoan.surat_balasan.pengirim || 'Operasional'}
                    {selectedLoan.surat_balasan.received_at ? ` · ${formatDateTime(selectedLoan.surat_balasan.received_at)}` : ''}
                  </div>
                  {selectedLoan.surat_balasan.tersedia ? (
                    <button type="button" className="btn btn-primary" onClick={openLoanLetter} disabled={letterLoading}>
                      <HiOutlineEye /> {letterLoading ? 'Membuka surat...' : 'Lihat Surat'}
                    </button>
                  ) : (
                    <Badge type="warning">PDF surat belum tersedia</Badge>
                  )}
                </div>
              )}
              {letterPreviewUrl && (
                <iframe
                  title={`Pratinjau dokumen ${selectedLoan.nomor_peminjaman}`}
                  src={letterPreviewUrl}
                  style={{ width: '100%', height: '60vh', marginTop: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeLoanDetail}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Loan Modal */}
      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        onSuccess={() => {
          setSuccessToast('Pengajuan peminjaman berhasil dibuat!');
          fetchLoans(1);
          fetchAllForStats();
          setTimeout(() => setSuccessToast(''), 5000);
        }}
      />
    </main>
  );
}
