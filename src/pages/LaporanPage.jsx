import { useState, useEffect } from 'react';
import {
  HiOutlinePrinter,
  HiOutlineSearch,
  HiOutlineInbox,
  HiOutlineViewGrid,
} from 'react-icons/hi';
import { MdFlight } from 'react-icons/md';
import { Loading, Badge, formatDate } from '../components/ui/Shared';
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

export default function LaporanPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);

  const fetchLaporan = () => {
    setLoading(true);
    const params = {
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      per_page: 50,
    };

    api.get('/loans', { params })
      .then(res => {
        let list = res.data?.data || res.data || [];
        if (startDate) {
          list = list.filter(item => (item.tanggal_peminjaman || item.created_at) >= startDate);
        }
        if (endDate) {
          list = list.filter(item => (item.tanggal_peminjaman || item.created_at) <= endDate);
        }
        setLoans(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLaporan();
  }, [statusFilter, startDate, endDate, debouncedSearch]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Menunggu':
        return <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Menunggu</span>;
      case 'Diproses':
        return <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Disetujui</span>;
      case 'Dipinjam':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Dipinjam</span>;
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
      {/* Official Print Header */}
      <div className="print-header only-print" style={{ display: 'none', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 800 }}>PT ANGKASA PURA INDONESIA</h2>
          <h3 style={{ margin: '4px 0', fontSize: '13pt', fontWeight: 600 }}>KANTOR CABANG BANDARA SUPADIO PONTIANAK</h3>
          <p style={{ margin: 0, fontSize: '10pt', color: '#444' }}>
            Unit Airport Technology &bull; Laporan Rekapitulasi Peminjaman Aset Operasional
          </p>
        </div>
      </div>

      {/* Header Row matching Screenshot 4 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
        className="no-print"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdFlight style={{ fontSize: '24px', color: '#0284c7' }} />
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
              Laporan Peminjaman Aset
            </h1>
          </div>
          <div style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
            Total: {loans.length} data
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          style={{
            background: '#dc2626',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
          id="btn-print-laporan"
        >
          <HiOutlinePrinter style={{ fontSize: '16px' }} /> Cetak / Export
        </button>
      </div>

      {/* Card Container matching Screenshot 4 */}
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
        {/* Filter Bar matching Screenshot 4 */}
        <form onSubmit={(e) => e.preventDefault()} className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Dropdown 1 with icon */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 10px', height: '42px' }}>
            <HiOutlineViewGrid style={{ color: '#64748b', fontSize: '16px', marginRight: '6px' }} />
            <select
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <option value="peminjaman">Peminjaman Aset</option>
            </select>
          </div>

          {/* Dropdown 2 Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              height: '42px',
              padding: '0 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '13px',
              color: '#334155',
              outline: 'none',
              minWidth: '130px',
            }}
          >
            <option value="">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Dipinjam">Dipinjam</option>
            <option value="Selesai">Selesai</option>
          </select>

          {/* Date 1 */}
          <div style={{ position: 'relative', minWidth: '140px' }}>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              placeholder="dd/mm/yyyy"
              style={{
                height: '42px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '12px',
                color: '#334155',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* Date 2 */}
          <div style={{ position: 'relative', minWidth: '140px' }}>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              placeholder="dd/mm/yyyy"
              style={{
                height: '42px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '12px',
                color: '#334155',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0 12px',
              height: '42px',
              flex: '1',
              minWidth: '220px',
            }}
          >
            <HiOutlineSearch style={{ color: '#94a3b8', fontSize: '18px', marginRight: '8px', flexShrink: 0 }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari peminjam, no, aset..."
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
        </form>

        {/* Table matching Screenshot 4 (7 columns) */}
        <div className="table-responsive">
          <table className="table" style={{ margin: 0, borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: '#0f223d' }}>
                <th style={{ width: '45px', textAlign: 'center', background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 8px' }}>NO</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px' }}>NO. PEMINJAMAN</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px' }}>ASET TERKAIT</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px' }}>PEMINJAM & UNIT</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px' }}>TANGGAL PINJAM</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px' }}>RENCANA KEMBALI</th>
                <th style={{ background: '#0f223d', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '12px 14px', textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}>
                    <Loading message="Memuat laporan..." />
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <HiOutlineInbox style={{ fontSize: '38px', color: '#94a3b8', marginBottom: '8px' }} />
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Tidak ada transaksi peminjaman yang ditemukan.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                loans.map((item, idx) => (
                  <tr key={item.id} onClick={() => setSelectedLoan(item)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} title="Klik baris untuk melihat detail peminjaman">
                    <td style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', padding: '12px 8px' }}>
                      {idx + 1}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f223d', fontSize: '12px', padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {item.nomor_peminjaman}
                    </td>
                    <td style={{ fontSize: '12px', color: '#1e293b', padding: '12px 14px' }}>
                      <div style={{ fontWeight: 500 }}>{item.aset?.nama_aset}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{item.aset?.kode_aset}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#334155', padding: '12px 14px' }}>
                      <div style={{ fontWeight: 500 }}>{item.nama_peminjam}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{item.unit}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#475569', padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {formatDate(item.tanggal_peminjaman)}
                    </td>
                    <td style={{ fontSize: '12px', color: '#475569', padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {item.tanggal_rencana_kembali ? formatDate(item.tanggal_rencana_kembali) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tanpa Tanggal Kembali</span>}
                      {item.tanggal_rencana_kembali && returnDateMonitor(item) && <div style={{ color: returnDateMonitor(item).overdue ? '#dc2626' : '#64748b', fontSize: '11px', marginTop: '3px' }}>{returnDateMonitor(item).label}</div>}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature Section for Print */}
      <div
        className="only-print"
        style={{
          display: 'none',
          marginTop: '40px',
          paddingTop: '20px',
          pageBreakInside: 'avoid',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
          <div style={{ width: '220px' }}>
            <p style={{ margin: 0, fontSize: '10pt' }}>Mengetahui,</p>
            <p style={{ margin: '2px 0 60px', fontSize: '10pt', fontWeight: 600 }}>Team Leader Airport Technology</p>
            <p style={{ margin: 0, fontSize: '10pt', fontWeight: 700, textDecoration: 'underline' }}>( .................................... )</p>
            <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. ..............................</p>
          </div>

          <div style={{ width: '220px' }}>
            <p style={{ margin: 0, fontSize: '10pt' }}>Pontianak, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p style={{ margin: '2px 0 60px', fontSize: '10pt', fontWeight: 600 }}>Petugas Operasional</p>
            <p style={{ margin: 0, fontSize: '10pt', fontWeight: 700, textDecoration: 'underline' }}>( Petugas Operasional )</p>
            <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>Unit Airport Technology</p>
          </div>
        </div>
      </div>

      {selectedLoan && (
        <div className="modal-backdrop" onClick={() => setSelectedLoan(null)} style={{ zIndex: 1060 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '92%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Detail Peminjaman: {selectedLoan.nomor_peminjaman || '-'}</h3>
              <button className="modal-close" onClick={() => setSelectedLoan(null)} aria-label="Tutup">×</button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
              <div><strong>Aset</strong><div>{selectedLoan.aset?.nama_aset || '-'}</div></div>
              <div><strong>Kode Aset</strong><div>{selectedLoan.aset?.kode_aset || '-'}</div></div>
              <div><strong>Peminjam</strong><div>{selectedLoan.nama_peminjam || '-'}</div></div>
              <div><strong>Unit</strong><div>{selectedLoan.unit || '-'}</div></div>
              <div><strong>Tanggal Pinjam</strong><div>{formatDate(selectedLoan.tanggal_peminjaman)}</div></div>
              <div><strong>Rencana Kembali</strong><div>{selectedLoan.tanggal_rencana_kembali ? formatDate(selectedLoan.tanggal_rencana_kembali) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tanpa Tanggal Kembali</span>}</div></div>
              <div><strong>Status</strong><div>{selectedLoan.status || '-'}</div></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setSelectedLoan(null)}>Tutup</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
