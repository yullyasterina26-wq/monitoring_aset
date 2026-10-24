import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineX,
  HiOutlineSwitchHorizontal,
  HiOutlinePaperClip,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
} from 'react-icons/hi';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import usePersistentDraft from '../../hooks/usePersistentDraft';

export default function MutationModal({
  isOpen,
  onClose,
  initialAsset = null,
  onSuccess,
}) {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedAssetObj, setSelectedAssetObj] = useState(null);

  const [tanggalMutasi, setTanggalMutasi] = useState(todayStr);
  const [lokasiAsal, setLokasiAsal] = useState('');
  const [lokasiTujuan, setLokasiTujuan] = useState('');
  const [unitTujuan, setUnitTujuan] = useState('');
  const [alasan, setAlasan] = useState('');
  const [petugas, setPetugas] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [dokumenFile, setDokumenFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const restoreDraft = useCallback((draft) => {
    setSelectedAssetId(draft.asetId || '');
    setSelectedAssetObj(draft.aset || null);
    setTanggalMutasi(draft.tanggalMutasi || todayStr);
    setLokasiAsal(draft.lokasiAsal || '');
    setLokasiTujuan(draft.lokasiTujuan || '');
    setUnitTujuan(draft.unitTujuan || '');
    setAlasan(draft.alasan || '');
    setPetugas(draft.petugas || '');
    setKeterangan(draft.keterangan || '');
    setDokumenFile(null);
  }, [todayStr]);
  const draftState = { asetId: selectedAssetId, aset: selectedAssetObj, tanggalMutasi, lokasiAsal, lokasiTujuan, unitTujuan, alasan, petugas, keterangan };
  const { visible, clearDraft } = usePersistentDraft('draft:mutation', isOpen, draftState, restoreDraft);
  const closeModal = () => { clearDraft(); onClose(); };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setFieldErrors({});
      setTanggalMutasi(todayStr);
      setPetugas(user?.name || 'Petugas Operasional');

      if (initialAsset) {
        setSelectedAssetId(initialAsset.id);
        setSelectedAssetObj(initialAsset);
        setLokasiAsal(initialAsset.lokasi || '');
      } else {
        setSelectedAssetId('');
        setSelectedAssetObj(null);
        setLokasiAsal('');
      }

      // Fetch assets list for dropdown
      api.get('/assets', { params: { per_page: 50 } })
        .then((res) => {
          const list = res.data?.data || res.data || [];
          setAvailableAssets(list);
          if (!initialAsset && list.length > 0) {
            setSelectedAssetId(list[0].id);
            setSelectedAssetObj(list[0]);
            setLokasiAsal(list[0].lokasi || '');
          }
        })
        .catch((err) => {
          console.error('Error fetching assets for mutation modal:', err);
        });
    }
  }, [isOpen, initialAsset, user, todayStr]);

  const handleAssetChange = (assetId) => {
    setSelectedAssetId(assetId);
    const found = availableAssets.find((a) => String(a.id) === String(assetId));
    setSelectedAssetObj(found || null);
    if (found) {
      setLokasiAsal(found.lokasi || '');
    }
  };

  if (!visible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});

    if (!selectedAssetId) {
      setErrorMsg('Pilih aset yang akan dimutasi.');
      return;
    }
    if (!lokasiTujuan.trim()) {
      setErrorMsg('Lokasi tujuan wajib diisi.');
      return;
    }
    if (!unitTujuan.trim()) {
      setErrorMsg('Unit tujuan wajib diisi.');
      return;
    }
    if (!alasan.trim()) {
      setErrorMsg('Alasan pemindahan / mutasi wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      if (dokumenFile) {
        // Send multipart/form-data
        const formData = new FormData();
        formData.append('tanggal_mutasi', tanggalMutasi);
        formData.append('aset_id', selectedAssetId);
        formData.append('lokasi_asal', lokasiAsal || selectedAssetObj?.lokasi || '-');
        formData.append('lokasi_tujuan', lokasiTujuan.trim());
        formData.append('unit_tujuan', unitTujuan.trim());
        formData.append('alasan', alasan.trim());
        formData.append('petugas', petugas || user?.name || 'Petugas Operasional');
        if (keterangan.trim()) {
          formData.append('keterangan', keterangan.trim());
        }
        formData.append('dokumen', dokumenFile);

        const res = await api.post('/mutations', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (onSuccess) onSuccess(res.data);
      } else {
        // Send application/json
        const payload = {
          tanggal_mutasi: tanggalMutasi,
          aset_id: Number(selectedAssetId),
          lokasi_asal: lokasiAsal || selectedAssetObj?.lokasi || '-',
          lokasi_tujuan: lokasiTujuan.trim(),
          unit_tujuan: unitTujuan.trim(),
          alasan: alasan.trim(),
          petugas: petugas || user?.name || 'Petugas Operasional',
          keterangan: keterangan.trim() || null,
        };

        const res = await api.post('/mutations', payload);
        if (onSuccess) onSuccess(res.data);
      }

      clearDraft();
      onClose();
    } catch (err) {
      console.error('Mutation submission error:', err);
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data?.errors || {});
        setErrorMsg(err.response.data?.message || 'Validasi formulir mutasi gagal. Periksa kolom yang ditandai.');
      } else {
        setErrorMsg(err.response?.data?.message || 'Gagal mengajukan mutasi. Periksa koneksi dan data aset.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeModal} style={{ zIndex: 1050 }}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineSwitchHorizontal style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Pengajuan Mutasi Aset</h3>
          </div>
          <button className="modal-close" onClick={closeModal} aria-label="Tutup">
            <HiOutlineX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {errorMsg && (
              <div
                className="alert alert-danger"
                style={{
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginBottom: '1rem',
                }}
              >
                <HiOutlineExclamationCircle style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Aset Selection */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="mutasi-aset-select" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Pilih Aset <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="mutasi-aset-select"
                className="form-control"
                value={selectedAssetId}
                onChange={(e) => handleAssetChange(e.target.value)}
                required
              >
                <option value="">-- Pilih Aset --</option>
                {availableAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.kode_aset} - {a.nama_aset} (Lokasi: {a.lokasi || '-'})
                  </option>
                ))}
              </select>
              {fieldErrors.aset_id && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                  {fieldErrors.aset_id[0]}
                </div>
              )}
            </div>

            {/* Grid 2 Columns: Tanggal & Petugas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="mutasi-tanggal" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Tanggal Mutasi <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="mutasi-tanggal"
                  type="date"
                  className="form-control"
                  value={tanggalMutasi}
                  onChange={(e) => setTanggalMutasi(e.target.value)}
                  required
                />
                {fieldErrors.tanggal_mutasi && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                    {fieldErrors.tanggal_mutasi[0]}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="mutasi-petugas" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Nama Petugas <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="mutasi-petugas"
                  type="text"
                  className="form-control"
                  value={petugas}
                  onChange={(e) => setPetugas(e.target.value)}
                  placeholder="Nama petugas mutasi"
                  required
                />
                {fieldErrors.petugas && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                    {fieldErrors.petugas[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Grid 2 Columns: Lokasi Asal & Lokasi Tujuan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="mutasi-lokasi-asal" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Lokasi Asal (Sesuai Posisi Aset Sekarang)
                </label>
                <input
                  id="mutasi-lokasi-asal"
                  type="text"
                  className="form-control"
                  value={lokasiAsal}
                  readOnly
                  style={{ background: 'var(--gray-100)', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                  Otomatis terisi dari lokasi aset saat ini.
                </span>
                {fieldErrors.lokasi_asal && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                    {fieldErrors.lokasi_asal[0]}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="mutasi-lokasi-tujuan" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Lokasi Tujuan <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="mutasi-lokasi-tujuan"
                  type="text"
                  className="form-control"
                  placeholder="Contoh: Ruang Server Lantai 2"
                  value={lokasiTujuan}
                  onChange={(e) => setLokasiTujuan(e.target.value)}
                  required
                />
                {fieldErrors.lokasi_tujuan && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                    {fieldErrors.lokasi_tujuan[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Unit Tujuan */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="mutasi-unit-tujuan" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Unit Tujuan <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="mutasi-unit-tujuan"
                type="text"
                className="form-control"
                placeholder="Contoh: Unit Airport Technology / Operasional"
                value={unitTujuan}
                onChange={(e) => setUnitTujuan(e.target.value)}
                required
              />
              {fieldErrors.unit_tujuan && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                  {fieldErrors.unit_tujuan[0]}
                </div>
              )}
            </div>

            {/* Alasan Pemindahan */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="mutasi-alasan" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Alasan Pemindahan <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="mutasi-alasan"
                className="form-control"
                rows="2"
                placeholder="Jelaskan kebutuhan pemindahan aset ke lokasi baru..."
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                required
              />
              {fieldErrors.alasan && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                  {fieldErrors.alasan[0]}
                </div>
              )}
            </div>

            {/* Keterangan Tambahan */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="mutasi-keterangan" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Keterangan Tambahan (Opsional)
              </label>
              <input
                id="mutasi-keterangan"
                type="text"
                className="form-control"
                placeholder="Catatan tambahan bila ada..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
            </div>

            {/* Dokumen Lampiran (Opsional) */}
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label htmlFor="mutasi-dokumen" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <HiOutlinePaperClip />
                <span>Dokumen Pendukung / Surat Permohonan (Opsional)</span>
              </label>
              <input
                id="mutasi-dokumen"
                type="file"
                className="form-control"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setDokumenFile(e.target.files?.[0] || null)}
                style={{ fontSize: '0.8rem' }}
              />
              {fieldErrors.dokumen && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                  {fieldErrors.dokumen[0]}
                </div>
              )}
            </div>

            {/* Info Notice */}
            <div
              style={{
                marginTop: '1rem',
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'var(--primary-50)',
                border: '1px solid var(--primary-100)',
                fontSize: '0.75rem',
                color: 'var(--primary-900)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <HiOutlineInformationCircle style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px', color: 'var(--primary-600)' }} />
              <span>
                Pengajuan mutasi dibuat dengan status <strong>Menunggu</strong>. Persetujuan mutasi dan update lokasi resmi akan diproses oleh admin pada sistem utama.
              </span>
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Mutasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
