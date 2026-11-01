import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineX,
  HiOutlinePlusCircle,
  HiOutlineCube,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
} from 'react-icons/hi';
import api from '../../services/api';
import usePersistentDraft from '../../hooks/usePersistentDraft';
import SearchableAssetSelect from './SearchableAssetSelect';
import PhotoEvidenceInput from './PhotoEvidenceInput';

export default function LoanModal({
  isOpen,
  onClose,
  initialAsset = null,
  onSuccess,
}) {
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assetCartonId, setAssetCartonId] = useState('');
  const [jumlahPcs, setJumlahPcs] = useState('');
  const [tanggalPeminjaman, setTanggalPeminjaman] = useState(() => new Date().toISOString().split('T')[0]);
  const [tanggalRencanaKembali, setTanggalRencanaKembali] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [namaPeminjam, setNamaPeminjam] = useState('');
  const [unit, setUnit] = useState('');
  const [keperluan, setKeperluan] = useState('');
  const [kondisiSaatDipinjam, setKondisiSaatDipinjam] = useState('Baik');
  const [keterangan, setKeterangan] = useState('');
  const [fotoPeminjaman, setFotoPeminjaman] = useState(null);
  const [fotoError, setFotoError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const restoreDraft = useCallback((draft) => {
    setSelectedAssetId(draft.asetId || '');
    setAssetCartonId(draft.assetCartonId || '');
    setJumlahPcs(draft.jumlahPcs || '');
    setTanggalPeminjaman(draft.tanggalPeminjaman || new Date().toISOString().split('T')[0]);
    setTanggalRencanaKembali(draft.tanggalRencanaKembali || '');
    setNamaPeminjam(draft.namaPeminjam || '');
    setUnit(draft.unit === 'Airport Technology' ? '' : (draft.unit || ''));
    setKeperluan(draft.keperluan || '');
    setKondisiSaatDipinjam(draft.kondisiSaatDipinjam || 'Baik');
    setKeterangan(draft.keterangan || '');
  }, []);
  const draftState = { asetId: selectedAssetId, assetCartonId, jumlahPcs, tanggalPeminjaman, tanggalRencanaKembali, namaPeminjam, unit, keperluan, kondisiSaatDipinjam, keterangan };
  const { visible, clearDraft } = usePersistentDraft('draft:loan', isOpen, draftState, restoreDraft);
  const closeModal = () => { clearDraft(); setNamaPeminjam(''); setFotoPeminjaman(null); setFotoError(''); onClose(); };
  const currentSelectedAsset = availableAssets.find((a) => String(a.id) === String(selectedAssetId)) || initialAsset;
  const isCartonAsset = currentSelectedAsset?.satuan === 'Kardus';
  const availableCartons = (currentSelectedAsset?.cartons || []).filter((carton) => Number(carton.pcs_tersedia) > 0);
  const selectedCarton = availableCartons.find((carton) => String(carton.id) === String(assetCartonId));

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setFieldErrors({});
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
  }, [isOpen, initialAsset]);

  if (!visible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) {
      setErrorMsg('Pilih aset yang ingin dipinjam.');
      return;
    }
    if (!tanggalRencanaKembali) {
      setErrorMsg('Harap isi rencana tanggal kembali.');
      return;
    }
    if (!keperluan.trim()) {
      setErrorMsg('Harap isi keperluan peminjaman.');
      return;
    }
    if (!namaPeminjam.trim()) {
      setErrorMsg('Harap isi nama orang yang akan meminjam aset.');
      return;
    }
    if (fotoError) {
      setErrorMsg(fotoError);
      return;
    }
    if (!fotoPeminjaman) {
      setErrorMsg('Foto bukti kondisi aset saat dipinjam wajib diunggah.');
      return;
    }
    if (isCartonAsset && !selectedCarton) {
      setErrorMsg('Pilih nomor seri kardus yang akan dipinjam.');
      return;
    }
    if (isCartonAsset && (!Number.isInteger(Number(jumlahPcs)) || Number(jumlahPcs) < 1 || Number(jumlahPcs) > Number(selectedCarton.pcs_tersedia))) {
      setErrorMsg('Jumlah pcs harus sesuai stok kardus yang tersedia.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setFieldErrors({});

    try {
      const payload = {
        aset_id: Number(selectedAssetId),
        tanggal_peminjaman: tanggalPeminjaman,
        tanggal_rencana_kembali: tanggalRencanaKembali,
        nama_peminjam: namaPeminjam.trim(),
        unit: unit.trim(),
        keperluan: keperluan.trim(),
        kondisi_saat_dipinjam: kondisiSaatDipinjam || 'Baik',
        keterangan: keterangan.trim() || null,
        ...(isCartonAsset ? { asset_carton_id: Number(assetCartonId), jumlah_pcs: Number(jumlahPcs) } : {}),
      };

      let requestBody = payload;
      if (fotoPeminjaman) {
        requestBody = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) requestBody.append(key, value);
        });
        requestBody.append('foto_peminjaman', fotoPeminjaman);
      }
      const res = await api.post('/loans', requestBody);
      clearDraft();
      setNamaPeminjam('');
      setFotoPeminjaman(null);
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

        <form onSubmit={handleSubmit} onInvalidCapture={() => setErrorMsg('Lengkapi semua kolom yang bertanda wajib sebelum mengirim pengajuan.')}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {errorMsg && (
              <div
                className="alert alert-danger"
                role="alert"
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
                onChange={(value) => { setSelectedAssetId(value); setAssetCartonId(''); setJumlahPcs(''); }}
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

            {isCartonAsset && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="loan-carton-serial" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Nomor Seri Kardus <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="loan-carton-serial"
                    className="form-control"
                    value={assetCartonId}
                    onChange={(event) => { setAssetCartonId(event.target.value); setJumlahPcs(''); }}
                    required
                  >
                    <option value="">Pilih kardus</option>
                    {availableCartons.map((carton) => (
                      <option key={carton.id} value={carton.id}>
                        {carton.nomor_seri} — tersedia {carton.pcs_tersedia} pcs
                      </option>
                    ))}
                  </select>
                  {fieldErrors.asset_carton_id && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>{fieldErrors.asset_carton_id[0]}</div>}
                  {availableCartons.length === 0 && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>Tidak ada kardus dengan stok tersedia.</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="loan-carton-quantity" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Jumlah pcs Dipinjam <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="loan-carton-quantity"
                    type="number"
                    className="form-control"
                    min="1"
                    max={selectedCarton?.pcs_tersedia || undefined}
                    value={jumlahPcs}
                    onChange={(event) => setJumlahPcs(event.target.value)}
                    disabled={!selectedCarton}
                    required
                  />
                  {selectedCarton && <small style={{ color: '#64748b' }}>Maksimal {selectedCarton.pcs_tersedia} pcs dari kardus ini.</small>}
                  {fieldErrors.jumlah_pcs && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>{fieldErrors.jumlah_pcs[0]}</div>}
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
                  Rencana Tanggal Kembali <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="loan-tanggal-kembali"
                  type="date"
                  className="form-control"
                  value={tanggalRencanaKembali}
                  onChange={(e) => setTanggalRencanaKembali(e.target.value)}
                  min={tanggalPeminjaman}
                  required
                />
                {fieldErrors.tanggal_rencana_kembali && (
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

            <PhotoEvidenceInput
              label="Foto Kondisi Aset Saat Dipinjam"
              required
              value={fotoPeminjaman}
              onChange={(file, error) => { setFotoPeminjaman(file); setFotoError(error); }}
              error={fotoError || fieldErrors.foto_peminjaman?.[0]}
            />

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
