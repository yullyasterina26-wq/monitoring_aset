import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineX,
  HiOutlinePlusCircle,
  HiOutlineCube,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
} from 'react-icons/hi';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import usePersistentDraft from '../../hooks/usePersistentDraft';
import SearchableAssetSelect from './SearchableAssetSelect';

export default function LoanModal({
  isOpen,
  onClose,
  initialAsset = null,
  onSuccess,
}) {
  const { user } = useAuth();

  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [tanggalPeminjaman, setTanggalPeminjaman] = useState(() => new Date().toISOString().split('T')[0]);
  const [tanggalRencanaKembali, setTanggalRencanaKembali] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [tanpaTanggalKembali, setTanpaTanggalKembali] = useState(false);
  const [namaPeminjam, setNamaPeminjam] = useState('');
  const [unit, setUnit] = useState('Airport Technology');
  const [keperluan, setKeperluan] = useState('');
  const [kondisiSaatDipinjam, setKondisiSaatDipinjam] = useState('Baik');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const restoreDraft = useCallback((draft) => {
    setSelectedAssetId(draft.asetId || '');
    setTanggalPeminjaman(draft.tanggalPeminjaman || new Date().toISOString().split('T')[0]);
    setTanggalRencanaKembali(draft.tanggalRencanaKembali || '');
    setTanpaTanggalKembali(Boolean(draft.tanpaTanggalKembali));
    setNamaPeminjam(draft.namaPeminjam || '');
    setUnit(draft.unit || '');
    setKeperluan(draft.keperluan || '');
    setKondisiSaatDipinjam(draft.kondisiSaatDipinjam || 'Baik');
    setKeterangan(draft.keterangan || '');
  }, []);
  const draftState = { asetId: selectedAssetId, tanggalPeminjaman, tanggalRencanaKembali, tanpaTanggalKembali, namaPeminjam, unit, keperluan, kondisiSaatDipinjam, keterangan };
  const { visible, clearDraft } = usePersistentDraft('draft:loan', isOpen, draftState, restoreDraft);
  const closeModal = () => { clearDraft(); onClose(); };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setFieldErrors({});
      setNamaPeminjam(user?.name || 'Petugas Operasional');

      if (initialAsset) {
        setSelectedAssetId(initialAsset.id);
        setKondisiSaatDipinjam(initialAsset.kondisi || 'Baik');
      } else {
        setSelectedAssetId('');
        setKondisiSaatDipinjam('Baik');
      }

      api.get('/assets', { params: { kondisi: 'Baik', per_page: 50 } })
        .then((res) => {
          const list = res.data?.data || res.data || [];
          const valid = list.filter((a) => a.kondisi === 'Baik');
          setAvailableAssets(valid);
          if (!initialAsset && valid.length > 0) {
            setSelectedAssetId(valid[0].id);
          }
        })
        .catch((err) => {
          console.error('Error fetching assets for loan modal:', err);
        });
    }
  }, [isOpen, initialAsset, user]);

  if (!visible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) {
      setErrorMsg('Pilih aset yang ingin dipinjam.');
      return;
    }
    if (!tanpaTanggalKembali && !tanggalRencanaKembali) {
      setErrorMsg('Harap isi rencana tanggal kembali atau centang tanpa tanggal kembali.');
      return;
    }
    if (!keperluan.trim()) {
      setErrorMsg('Harap isi keperluan peminjaman.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setFieldErrors({});

    try {
      const payload = {
        aset_id: Number(selectedAssetId),
        tanggal_peminjaman: tanggalPeminjaman,
        tanpa_tanggal_kembali: tanpaTanggalKembali ? 1 : 0,
        tanggal_rencana_kembali: tanpaTanggalKembali ? null : tanggalRencanaKembali,
        nama_peminjam: (namaPeminjam || user?.name || 'Petugas Operasional').trim(),
        unit: (unit || 'Airport Technology').trim(),
        keperluan: keperluan.trim(),
        kondisi_saat_dipinjam: kondisiSaatDipinjam || 'Baik',
        keterangan: keterangan.trim() || null,
      };

      const res = await api.post('/loans', payload);
      clearDraft();
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Loan creation error:', err);
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data?.errors || {});
        setErrorMsg(err.response.data?.message || 'Validasi formulir peminjaman gagal. Periksa kolom yang ditandai.');
      } else {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Gagal mengajukan peminjaman. Periksa kembali tanggal dan ketersediaan aset.';
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentSelectedAsset =
    availableAssets.find((a) => String(a.id) === String(selectedAssetId)) || initialAsset;

  return (
    <div className="modal-backdrop" onClick={closeModal} style={{ zIndex: 1050 }}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlinePlusCircle style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Formulir Pengajuan Peminjaman Aset</h3>
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
              <label htmlFor="loan-aset-select" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Aset yang Dipinjam (Hanya Kondisi Baik) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <SearchableAssetSelect
                id="loan-aset-select"
                assets={availableAssets}
                value={selectedAssetId}
                onChange={setSelectedAssetId}
                selectedAsset={initialAsset}
                placeholder="Cari atau pilih aset tersedia..."
              />
              {fieldErrors.aset_id && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                  {fieldErrors.aset_id[0]}
                </div>
              )}
            </div>

            {/* Selected Asset Info Box */}
            {currentSelectedAsset && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--primary-50)',
                  border: '1px solid var(--primary-100)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.825rem',
                }}
              >
                <HiOutlineCube style={{ fontSize: '20px', color: 'var(--primary-700)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--primary-900)' }}>
                    {currentSelectedAsset.nama_aset} ({currentSelectedAsset.kode_aset})
                  </div>
                  <div style={{ color: 'var(--primary-700)', fontSize: '0.75rem' }}>
                    Lokasi: {currentSelectedAsset.lokasi || '-'} &bull; Merek: {currentSelectedAsset.merek || '-'}
                  </div>
                </div>
              </div>
            )}

            {/* Dates Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="loan-tanggal-pinjam" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Tanggal Peminjaman <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="loan-tanggal-pinjam"
                  type="date"
                  className="form-control"
                  value={tanggalPeminjaman}
                  onChange={(e) => setTanggalPeminjaman(e.target.value)}
                  required
                />
                {fieldErrors.tanggal_peminjaman && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                    {fieldErrors.tanggal_peminjaman[0]}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="loan-tanggal-kembali" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Rencana Tanggal Kembali {!tanpaTanggalKembali && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <input
                  id="loan-tanggal-kembali"
                  type="date"
                  className="form-control"
                  value={tanpaTanggalKembali ? '' : tanggalRencanaKembali}
                  onChange={(e) => setTanggalRencanaKembali(e.target.value)}
                  min={tanggalPeminjaman}
                  disabled={tanpaTanggalKembali}
                  required={!tanpaTanggalKembali}
                  style={tanpaTanggalKembali ? { background: 'var(--gray-100)', cursor: 'not-allowed', color: 'var(--gray-500)' } : {}}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    id="loan-tanpa-tanggal-kembali"
                    checked={tanpaTanggalKembali}
                    onChange={(e) => {
                      setTanpaTanggalKembali(e.target.checked);
                      if (fieldErrors.tanggal_rencana_kembali) {
                        setFieldErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.tanggal_rencana_kembali;
                          return copy;
                        });
                      }
                    }}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary-600)' }}
                  />
                  <label
                    htmlFor="loan-tanpa-tanggal-kembali"
                    style={{ fontSize: '0.8rem', color: 'var(--gray-700)', cursor: 'pointer', userSelect: 'none', margin: 0, fontWeight: 500 }}
                  >
                    Tanpa Tanggal Kembali
                  </label>
                </div>
                {fieldErrors.tanggal_rencana_kembali && !tanpaTanggalKembali && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                    {fieldErrors.tanggal_rencana_kembali[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Peminjam & Unit */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="loan-nama-peminjam" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Nama Peminjam <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="loan-nama-peminjam"
                  type="text"
                  className="form-control"
                  value={namaPeminjam}
                  onChange={(e) => setNamaPeminjam(e.target.value)}
                  placeholder="Nama peminjam"
                  required
                />
                {fieldErrors.nama_peminjam && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                    {fieldErrors.nama_peminjam[0]}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="loan-unit" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Unit Kerja <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="loan-unit"
                  type="text"
                  className="form-control"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Contoh: Airport Technology"
                  required
                />
                {fieldErrors.unit && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                    {fieldErrors.unit[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Keperluan */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="loan-keperluan" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Keperluan Peminjaman <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="loan-keperluan"
                className="form-control"
                rows="2"
                placeholder="Jelaskan tujuan pemakaian atau kegiatan lapangan..."
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                required
              />
              {fieldErrors.keperluan && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                  {fieldErrors.keperluan[0]}
                </div>
              )}
            </div>

            {/* Keterangan */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="loan-keterangan" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Keterangan Tambahan (Opsional)
              </label>
              <input
                id="loan-keterangan"
                type="text"
                className="form-control"
                placeholder="Catatan tambahan bila ada..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
            </div>

            {/* Status notice */}
            <div
              style={{
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
                Pengajuan dibuat dengan status <strong>Menunggu</strong>. Persetujuan peminjaman serta proses serah terima (BAST) dan pengembalian dilakukan oleh admin pada sistem utama.
              </span>
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Peminjaman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
