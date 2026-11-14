import { useCallback, useEffect, useState } from 'react';
import {
  HiOutlineExclamationCircle,
  HiOutlineTrash,
  HiOutlineX,
} from 'react-icons/hi';
import api from '../../services/api';
import usePersistentDraft from '../../hooks/usePersistentDraft';
import PhotoEvidenceInput from './PhotoEvidenceInput';
import SearchableAssetSelect from './SearchableAssetSelect';

const disposalLocations = ['Gudang Aset', 'Gudang Limbah', 'Gudang Demolish'];

export default function DeletionModal({ isOpen, onClose, onSuccess, initialAsset = null }) {
  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState('');
  const [reason, setReason] = useState('');
  const [disposalLocation, setDisposalLocation] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const restoreDraft = useCallback((draft) => {
    setAssetId(draft.asetId || '');
    setReason(draft.reason || '');
    setDisposalLocation(disposalLocations.includes(draft.disposalLocation) ? draft.disposalLocation : '');
    setNote(draft.note || '');
  }, []);
  const draftState = { asetId: assetId, reason, disposalLocation, note };
  const { visible, clearDraft } = usePersistentDraft('draft:deletion', isOpen, draftState, restoreDraft);

  useEffect(() => {
    if (!isOpen) return;
    setAssetId(initialAsset?.id ? String(initialAsset.id) : '');
    setErrorMsg('');
    setFieldErrors({});
    setLoadingAssets(true);
    api.get('/asset-deletion-requests')
      .then(({ data }) => setAssets(data.assets || []))
      .catch((error) => {
        setErrorMsg(error.response?.data?.message || 'Daftar aset untuk penghapusan gagal dimuat.');
      })
      .finally(() => setLoadingAssets(false));
  }, [isOpen, initialAsset?.id]);

  const closeModal = () => {
    if (loading) return;
    clearDraft();
    setAssetId('');
    setReason('');
    setDisposalLocation('');
    setNote('');
    setPhoto(null);
    setPhotoError('');
    setErrorMsg('');
    setFieldErrors({});
    onClose();
  };

  if (!visible) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setFieldErrors({});

    if (!assetId) {
      setErrorMsg('Pilih aset yang akan diajukan untuk penghapusan.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Alasan penghapusan wajib diisi.');
      return;
    }
    if (!disposalLocation) {
      setErrorMsg('Pilih tempat pembuangan aset.');
      return;
    }
    if (photoError) {
      setErrorMsg(photoError);
      return;
    }
    if (!photo) {
      setErrorMsg('Foto bukti kondisi aset wajib diunggah.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('aset_id', assetId);
      formData.append('alasan', reason.trim());
      formData.append('tempat_pembuangan', disposalLocation);
      if (note.trim()) formData.append('keterangan_tambahan', note.trim());
      formData.append('foto', photo);

      const { data } = await api.post('/asset-deletion-requests', formData);
      clearDraft();
      setAssetId('');
      setReason('');
      setDisposalLocation('');
      setNote('');
      setPhoto(null);
      setPhotoError('');
      onSuccess?.(data);
      onClose();
    } catch (error) {
      if (error.response?.status === 422) {
        setFieldErrors(error.response.data?.errors || {});
        setErrorMsg(error.response.data?.message || 'Validasi pengajuan gagal. Periksa kolom yang ditandai.');
      } else {
        setErrorMsg(error.response?.data?.message || 'Pengajuan penghapusan gagal dikirim.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeModal} style={{ zIndex: 1050 }}>
      <div className="modal-dialog" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '560px', width: '92%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineTrash style={{ fontSize: '1.25rem', color: '#dc2626' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Catat Penghapusan Aset</h3>
          </div>
          <button type="button" className="modal-close" onClick={closeModal} aria-label="Tutup">
            <HiOutlineX />
          </button>
        </div>

        <form onSubmit={handleSubmit} onInvalidCapture={() => setErrorMsg('Lengkapi semua kolom yang bertanda wajib sebelum mengirim pengajuan.')}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {errorMsg && (
              <div className="alert alert-danger" role="alert" style={{ fontSize: '0.85rem', display: 'flex', gap: '8px' }}>
                <HiOutlineExclamationCircle style={{ fontSize: '18px', flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="deletion-modal-asset">Pilih Aset <span style={{ color: '#ef4444' }}>*</span></label>
              <SearchableAssetSelect
                id="deletion-modal-asset"
                assets={assets}
                value={assetId}
                onChange={setAssetId}
                placeholder={loadingAssets ? 'Memuat daftar aset...' : 'Cari atau pilih aset...'}
              />
              {fieldErrors.aset_id && <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>{fieldErrors.aset_id[0]}</div>}
              {!loadingAssets && !assets.length && <small style={{ color: 'var(--gray-500)' }}>Tidak ada aset yang dapat diajukan saat ini.</small>}
            </div>

            <div className="form-group">
              <label htmlFor="deletion-modal-reason">Alasan Penghapusan <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                id="deletion-modal-reason"
                className="form-control"
                rows="3"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={5000}
                placeholder="Jelaskan alasan aset perlu dihapus dari inventaris..."
                required
              />
              {fieldErrors.alasan && <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>{fieldErrors.alasan[0]}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="deletion-modal-location">Tempat Pembuangan <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                id="deletion-modal-location"
                className="form-control"
                value={disposalLocation}
                onChange={(event) => {
                  setDisposalLocation(event.target.value);
                  setFieldErrors((previous) => ({ ...previous, tempat_pembuangan: undefined }));
                  setErrorMsg('');
                }}
                required
              >
                <option value="">Pilih tempat pembuangan</option>
                {disposalLocations.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              {fieldErrors.tempat_pembuangan && <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>{fieldErrors.tempat_pembuangan[0]}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="deletion-modal-note">Keterangan Tambahan</label>
              <textarea
                id="deletion-modal-note"
                className="form-control"
                rows="3"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={5000}
                placeholder="Informasi pendukung (opsional)"
              />
            </div>

            <PhotoEvidenceInput
              label="Foto Kondisi Aset"
              required
              value={photo}
              onChange={(file, validationError) => {
                setPhoto(file);
                setPhotoError(validationError);
              }}
              error={photoError}
            />
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={loading}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading || loadingAssets || !assets.length}>
              {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
