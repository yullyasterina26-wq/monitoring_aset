import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineX,
  HiOutlineClipboardCheck,
  HiOutlineExclamationCircle,
  HiOutlineQrcode,
} from 'react-icons/hi';
import api from '../../services/api';
import usePersistentDraft from '../../hooks/usePersistentDraft';
import QrScannerModal from './QrScannerModal';
import SearchableAssetSelect from './SearchableAssetSelect';

export default function InspectionModal({
  isOpen,
  onClose,
  initialAsset = null,
  onSuccess,
}) {
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [kondisiBaru, setKondisiBaru] = useState('Baik');
  const [keterangan, setKeterangan] = useState('Pemeriksaan fisik rutin operasional');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const restoreDraft = useCallback((draft) => {
    setSelectedAssetId(draft.asetId || '');
    setKondisiBaru(draft.kondisiBaru || 'Baik');
    setKeterangan(draft.keterangan || '');
  }, []);
  const draftState = { asetId: selectedAssetId, kondisiBaru, keterangan };
  const { visible, clearDraft } = usePersistentDraft('draft:inspection', isOpen, draftState, restoreDraft);
  const closeModal = () => { clearDraft(); onClose(); };

  const handleScannedAsset = (asset) => {
    setAvailableAssets((current) => current.some((item) => item.id === asset.id)
      ? current
      : [asset, ...current]);
    setSelectedAssetId(asset.id);
    if (['Baik', 'Rusak Ringan', 'Rusak Berat'].includes(asset.kondisi)) {
      setKondisiBaru(asset.kondisi);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setFieldErrors({});

      if (initialAsset) {
        setSelectedAssetId(initialAsset.id);
        setKondisiBaru(initialAsset.kondisi || 'Baik');
      } else {
        setSelectedAssetId('');
        setKondisiBaru('Baik');
      }

      api.get('/assets', { params: { per_page: 50 } })
        .then((res) => {
          const list = res.data?.data || res.data || [];
          setAvailableAssets(list);
          if (!initialAsset && list.length > 0) {
            setSelectedAssetId(list[0].id);
            setKondisiBaru(list[0].kondisi || 'Baik');
          }
        })
        .catch((err) => {
          console.error('Error fetching assets for inspection modal:', err);
        });
    }
  }, [isOpen, initialAsset]);

  if (!visible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetId) {
      setErrorMsg('Pilih aset yang diperiksa.');
      return;
    }
    if (!keterangan.trim()) {
      setErrorMsg('Catatan hasil pemeriksaan wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setFieldErrors({});

    try {
      const payload = {
        aset_id: Number(selectedAssetId),
        kondisi_baru: kondisiBaru,
        keterangan: keterangan.trim(),
      };

      const res = await api.post('/operasional/pemeriksaan', payload);
      clearDraft();
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      console.error('Inspection error:', err);
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data?.errors || {});
        setErrorMsg(err.response.data?.message || 'Validasi pemeriksaan gagal.');
      } else {
        setErrorMsg(err.response?.data?.message || 'Gagal menyimpan pemeriksaan aset.');
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
        style={{ maxWidth: '500px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineClipboardCheck style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Catat Pemeriksaan Aset</h3>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <label htmlFor="pemeriksaan-aset-select" style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Pilih Aset <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button type="button" className="btn btn-secondary" onClick={() => setIsQrScannerOpen(true)} style={{ padding: '5px 9px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <HiOutlineQrcode /> Scan QR Code
                </button>
              </div>
              <SearchableAssetSelect
                id="pemeriksaan-aset-select"
                assets={availableAssets}
                value={selectedAssetId}
                onChange={setSelectedAssetId}
                selectedAsset={initialAsset}
                placeholder="Cari atau pilih aset..."
              />
              {fieldErrors.aset_id && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                  {fieldErrors.aset_id[0]}
                </div>
              )}
            </div>

            {/* Kondisi Baru */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="pemeriksaan-kondisi-baru" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Kondisi Fisik Baru <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="pemeriksaan-kondisi-baru"
                className="form-control"
                value={kondisiBaru}
                onChange={(e) => setKondisiBaru(e.target.value)}
                required
              >
                <option value="Baik">Baik (Beroperasi Normal)</option>
                <option value="Rusak Ringan">Rusak Ringan (Perlu Perbaikan Kecil)</option>
                <option value="Rusak Berat">Rusak Berat (Tidak Dapat Digunakan)</option>
              </select>
              {fieldErrors.kondisi_baru && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                  {fieldErrors.kondisi_baru[0]}
                </div>
              )}
            </div>

            {/* Keterangan / Catatan Fisik */}
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label htmlFor="pemeriksaan-keterangan" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Catatan Pemeriksaan Lapangan <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                id="pemeriksaan-keterangan"
                className="form-control"
                rows="3"
                placeholder="Deskripsikan hasil cek fisik, fungsi tombol, kebersihan, atau kerusakan..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                required
              />
              {fieldErrors.keterangan && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                  {fieldErrors.keterangan[0]}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Hasil Pemeriksaan'}
            </button>
          </div>
        </form>
      </div>
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onSelectAssetForInspection={handleScannedAsset}
      />
    </div>
  );
}
