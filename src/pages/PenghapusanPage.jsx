import { Fragment, useEffect, useState } from 'react';
import { HiOutlineTrash, HiOutlineRefresh } from 'react-icons/hi';
import { Loading, Pagination, formatDateTime } from '../components/ui/Shared';
import PhotoEvidenceInput from '../components/ui/PhotoEvidenceInput';
import ImagePreview from '../components/ui/ImagePreview';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const statusColors = {
  Menunggu: ['#fef3c7', '#92400e'],
  'Menunggu Persetujuan': ['#fef3c7', '#92400e'],
  Disetujui: ['#dcfce7', '#166534'],
  'Dalam Proses': ['#dbeafe', '#1d4ed8'],
  Selesai: ['#dcfce7', '#166534'],
  Ditolak: ['#fee2e2', '#991b1b'],
};

function ProtectedDeletionPhoto({ requestId }) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    api.get(`/asset-deletion-requests/${requestId}/photo`, { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setPhotoUrl(objectUrl);
      })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [requestId]);

  if (failed) return <span style={{ color: 'var(--gray-500)' }}>Foto tidak dapat dimuat</span>;
  if (!photoUrl) return <span style={{ color: 'var(--gray-500)' }}>Memuat foto...</span>;
  return <ImagePreview src={photoUrl} alt="Foto bukti penghapusan" imageStyle={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px' }} />;
}

export default function PenghapusanPage() {
  const { canApprove, canManageAssets, isOperator } = useAuth();
  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [reason, setReason] = useState('');
  const [disposalLocation, setDisposalLocation] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const damagedAssets = assets.filter((asset) => /^rusak(?:\s|$)/i.test((asset.kondisi || '').trim()));
  const eligibleAssets = canManageAssets ? assets : damagedAssets;
  const canSubmitRequest = isOperator || canManageAssets;

  const fetchData = async (pageNum = page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/asset-deletion-requests', { params: { page: pageNum, per_page: 10 } });
      setError('');
      setAssets(data.assets || []);
      const result = data.requests || {};
      setRequests(result.data || []);
      setPagination({
        currentPage: result.current_page || 1,
        lastPage: result.last_page || 1,
        total: result.total || 0,
        from: result.from || 0,
        to: result.to || 0,
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Data pengajuan penghapusan gagal dimuat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(page); }, [page]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (photoError) return setError(photoError);
    if (!photo) return setError('Foto bukti kondisi aset wajib diunggah.');
    if (!assetId || !reason.trim() || !disposalLocation) return setError('Pilih aset, tempat pembuangan, dan isi alasan penghapusan.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('aset_id', assetId);
      formData.append('alasan', reason.trim());
      formData.append('tempat_pembuangan', disposalLocation);
      if (note.trim()) formData.append('keterangan_tambahan', note.trim());
      if (photo) formData.append('foto', photo);
      const { data } = await api.post('/asset-deletion-requests', formData);
      setAssetId('');
      setReason('');
      setDisposalLocation('');
      setNote('');
      setPhoto(null);
      setPhotoError('');
      setPage(1);
      await fetchData(1);
      setSuccess(data.message || 'Pengajuan berhasil dikirim dan menunggu persetujuan Admin Persetujuan.');
    } catch (requestError) {
      const validationErrors = requestError.response?.data?.errors;
      setError(validationErrors ? Object.values(validationErrors).flat().join(' ') : (requestError.response?.data?.message || 'Pengajuan gagal dikirim.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="main-content page-enter" style={{ padding: '24px 28px', maxWidth: '1440px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HiOutlineTrash style={{ fontSize: '24px', color: '#dc2626' }} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>Penghapusan Aset</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--gray-500)', fontSize: '0.85rem' }}>{canApprove ? 'Tinjau pengajuan dari operasional dan proses persetujuannya.' : 'Ajukan aset untuk ditinjau dan disetujui admin.'}</p>
          </div>
        </div>
        <button className="btn btn-secondary" type="button" onClick={() => fetchData(page)} disabled={loading}>
          <HiOutlineRefresh /> Muat Ulang
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {canSubmitRequest && <section className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header"><h2 style={{ margin: 0, fontSize: '1rem' }}>Buat Pengajuan Penghapusan</h2></div>
        <form className="card-body" onSubmit={submit} onInvalidCapture={() => setError('Lengkapi semua kolom yang bertanda wajib sebelum mengirim pengajuan.') }>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="deletion-asset">Aset <span style={{ color: '#ef4444' }}>*</span></label>
              <select id="deletion-asset" className="form-control" value={assetId} onChange={(event) => setAssetId(event.target.value)} required>
                <option value="">Pilih aset yang akan diajukan</option>
                {eligibleAssets.map((asset) => (
                  <option key={asset.id} value={asset.id} disabled={Boolean(asset.pending_deletion_request)}>
                    {asset.kode_aset} — {asset.nama_aset} ({asset.kondisi}){asset.pending_deletion_request ? ' — Menunggu persetujuan Admin' : ''}
                  </option>
                ))}
              </select>
              {!eligibleAssets.length && <small style={{ color: 'var(--gray-500)' }}>Tidak ada aset yang dapat diajukan saat ini.</small>}
            </div>
            <div className="form-group">
              <label htmlFor="deletion-reason">Alasan Penghapusan <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea id="deletion-reason" className="form-control" rows="3" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={5000} placeholder="Jelaskan alasan aset perlu dihapus dari inventaris..." required />
            </div>
            <div className="form-group">
              <label htmlFor="deletion-location">Tempat Pembuangan <span style={{ color: '#ef4444' }}>*</span></label>
              <select id="deletion-location" className="form-control" value={disposalLocation} onChange={(event) => setDisposalLocation(event.target.value)} required>
                <option value="">Pilih tempat pembuangan</option>
                <option value="Gudang Limbah">Gudang Limbah</option>
                <option value="Gudang Polis">Gudang Polis</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="deletion-note">Keterangan Tambahan</label>
              <textarea id="deletion-note" className="form-control" rows="3" value={note} onChange={(event) => setNote(event.target.value)} maxLength={5000} placeholder="Informasi pendukung (opsional)" />
            </div>
            <PhotoEvidenceInput label="Foto Kondisi Aset" required value={photo} onChange={(file, validationError) => { setPhoto(file); setPhotoError(validationError); }} error={photoError} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting || !eligibleAssets.length}>
              {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      </section>}

      <section className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>{canApprove ? 'Pengajuan dari Operasional' : 'Daftar Pengajuan Saya'}</h2>
          <span className="badge badge-default">{pagination.total} pengajuan</span>
        </div>
        {loading && requests.length === 0 ? <Loading /> : !requests.length ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-500)' }}>Belum ada pengajuan penghapusan aset.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead><tr><th>Tanggal</th><th>Aset</th><th>Tempat Pembuangan</th><th>Alasan</th><th>Foto</th><th>Status</th><th>Catatan Admin</th><th>Detail</th></tr></thead>
              <tbody>{requests.map((item) => {
                const colors = statusColors[item.status] || statusColors.Menunggu;
                return <Fragment key={item.id}>
                <tr>
                  <td>{formatDateTime(item.created_at)}</td>
                  <td><strong>{item.aset?.kode_aset || '-'}</strong><br />{item.aset?.nama_aset || '-'}</td>
                  <td>{item.tempat_pembuangan || '-'}</td>
                  <td style={{ minWidth: '220px', whiteSpace: 'normal' }}>{item.alasan}{item.keterangan_tambahan && <div style={{ marginTop: '4px', color: 'var(--gray-500)' }}>{item.keterangan_tambahan}</div>}</td>
                  <td>{item.foto ? <ProtectedDeletionPhoto requestId={item.id} /> : '-'}</td>
                  <td><span style={{ padding: '4px 9px', borderRadius: '999px', background: colors[0], color: colors[1], fontSize: '0.75rem', fontWeight: 700 }}>{item.status}</span></td>
                  <td style={{ minWidth: '180px', whiteSpace: 'normal' }}>{item.catatan_persetujuan || (item.status === 'Menunggu' ? 'Menunggu tinjauan admin' : '-')}</td>
                  <td><button type="button" className="btn btn-secondary btn-sm" aria-expanded={selectedRequestId === item.id} onClick={() => setSelectedRequestId(selectedRequestId === item.id ? null : item.id)}>{selectedRequestId === item.id ? 'Tutup' : 'Detail'}</button></td>
                </tr>
                {selectedRequestId === item.id && <tr key={`${item.id}-detail`}><td colSpan="8" style={{ whiteSpace: 'normal', background: 'var(--gray-50, #f8fafc)' }}>
                  <strong>Detail aset:</strong> {item.aset?.nama_aset || '-'} · Kode: {item.aset?.kode_aset || '-'} · Nomor seri: {item.aset?.nomor_seri || '-'} · Merek/tipe: {[item.aset?.merek, item.aset?.tipe].filter(Boolean).join(' ') || '-'} · Lokasi: {item.aset?.lokasi || '-'} · Kondisi: {item.aset?.kondisi || '-'}
                  <br /><strong>Operator:</strong> {item.pengaju?.name || '-'} · <strong>Diproses oleh:</strong> {item.pemroses?.name || '-'} · <strong>Waktu keputusan:</strong> {item.processed_at ? formatDateTime(item.processed_at) : '-'}
                  {item.completed_at && <><br /><strong>Penghapusan selesai:</strong> {formatDateTime(item.completed_at)}</>}
                  {item.catatan_persetujuan && <><br /><strong>Catatan/alasan keputusan:</strong> {item.catatan_persetujuan}</>}
                </td></tr>}
                </Fragment>;
              })}</tbody>
            </table>
          </div>
        )}
        <Pagination {...pagination} onPageChange={setPage} />
      </section>
    </main>
  );
}
