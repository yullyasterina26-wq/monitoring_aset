import { useEffect, useRef, useState } from 'react';
import { HiOutlineCamera, HiOutlinePhotograph, HiOutlineX } from 'react-icons/hi';

export default function PhotoEvidenceInput({
  label = 'Foto Bukti (Opsional)',
  value,
  onChange,
  error,
  required = false,
  accept = 'image/jpeg,image/png',
  maxSizeMb = 5,
}) {
  const uploadInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const previewUrlRef = useRef('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!cameraOpen || !cameraStreamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = cameraStreamRef.current;
    videoRef.current.play().catch(() => setCameraError('Kamera tidak dapat memulai pratinjau. Silakan coba lagi.'));
  }, [cameraOpen]);

  const setPreview = (file) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = file?.type?.startsWith('image/') ? URL.createObjectURL(file) : '';
    setPreviewUrl(previewUrlRef.current);
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    if (file && file.size > maxSizeMb * 1024 * 1024) {
      setPreview(null);
      onChange(null, `Ukuran file maksimal ${maxSizeMb} MB.`);
      return;
    }
    setPreview(file);
    onChange(file, '');
  };

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraOpen(false);
    setCameraLoading(false);
  };

  const openCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Browser tidak mendukung akses kamera langsung. Gunakan tombol Pilih Foto.');
      setCameraOpen(true);
      return;
    }

    setCameraLoading(true);
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch (error) {
        if (!['OverconstrainedError', 'NotFoundError'].includes(error?.name)) throw error;
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      cameraStreamRef.current = stream;
      setCameraOpen(true);
    } catch (error) {
      const message = error?.name === 'NotAllowedError'
        ? 'Izin kamera ditolak. Izinkan akses kamera di browser lalu coba lagi.'
        : error?.name === 'NotFoundError'
          ? 'Kamera tidak ditemukan pada perangkat ini.'
          : `Kamera gagal dibuka: ${error?.message || 'periksa izin dan koneksi kamera.'}`;
      setCameraError(message);
      setCameraOpen(true);
    } finally {
      setCameraLoading(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video?.videoWidth || !video?.videoHeight || !canvas) {
      setCameraError('Kamera belum siap. Tunggu pratinjau muncul lalu coba lagi.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError('Foto gagal dibuat. Silakan ambil ulang.');
        return;
      }
      const file = new File([blob], `foto-bukti-${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (file.size > maxSizeMb * 1024 * 1024) {
        setCameraError(`Ukuran foto melebihi batas ${maxSizeMb} MB. Dekatkan objek atau gunakan Pilih Foto.`);
        return;
      }
      setPreview(file);
      onChange(file, '');
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '0.8rem',
  };

  return (
    <div className="form-group" style={{ marginBottom: '1rem' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <input ref={uploadInputRef} type="file" accept={accept} onChange={handleFile} hidden />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
        <button type="button" className="btn btn-secondary" style={buttonStyle} onClick={() => uploadInputRef.current?.click()}>
          <HiOutlinePhotograph /> Pilih Foto
        </button>
        <button type="button" className="btn btn-secondary" style={buttonStyle} onClick={openCamera} disabled={cameraLoading}>
          <HiOutlineCamera /> {cameraLoading ? 'Membuka Kamera...' : 'Ambil Foto'}
        </button>
      </div>
      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          {previewUrl && (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              aria-label="Perbesar foto bukti"
              title="Klik untuk memperbesar foto"
              style={{ padding: 0, border: 0, borderRadius: '8px', background: 'transparent', cursor: 'zoom-in', lineHeight: 0 }}
            >
              <img src={previewUrl} alt="Pratinjau foto bukti" style={{ width: '88px', height: '88px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--gray-300)' }} />
            </button>
          )}
          <span style={{ minWidth: 0, overflowWrap: 'anywhere', fontSize: '0.8rem', color: 'var(--gray-600)' }}>{value.name}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" aria-label="Hapus foto" onClick={() => { setPreview(null); onChange(null, ''); }}>
            <HiOutlineX />
          </button>
        </div>
      )}
      {error && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{error}</div>}
      {!error && <small style={{ display: 'block', marginTop: '5px', color: 'var(--gray-500)' }}>{required ? 'Foto wajib diunggah. ' : ''}Format gambar JPG atau PNG; maksimal {maxSizeMb} MB.</small>}

      {previewOpen && previewUrl && (
        <div className="modal-backdrop" onClick={() => setPreviewOpen(false)} style={{ zIndex: 1300 }}>
          <div className="modal-dialog" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 'min(900px, 94vw)', width: 'fit-content' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Foto Bukti</h3>
              <button type="button" className="modal-close" onClick={() => setPreviewOpen(false)} aria-label="Tutup pratinjau">×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#111', padding: '12px' }}>
              <img src={previewUrl} alt="Foto bukti ukuran penuh" style={{ display: 'block', maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '6px' }} />
            </div>
          </div>
        </div>
      )}

      {cameraOpen && (
        <div className="modal-backdrop" onClick={stopCamera} style={{ zIndex: 1200 }}>
          <div className="modal-dialog" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '560px', width: '92%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Ambil Foto Bukti</h3>
              <button type="button" className="modal-close" onClick={stopCamera} aria-label="Tutup kamera">×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              {cameraError ? (
                <div>
                  <div className="alert alert-danger" style={{ marginBottom: '12px' }}>{cameraError}</div>
                  <button type="button" className="btn btn-secondary" onClick={openCamera} disabled={cameraLoading}>
                    {cameraLoading ? 'Membuka Kamera...' : 'Coba Lagi'}
                  </button>
                  <small style={{ display: 'block', marginTop: '10px', color: 'var(--gray-500)' }}>
                    Akses kamera langsung memerlukan izin browser dan koneksi HTTPS (atau localhost).
                  </small>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ display: 'block', width: '100%', maxHeight: '60vh', background: '#111', borderRadius: '8px', objectFit: 'contain' }}
                />
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={stopCamera}>Batal</button>
              {!cameraError && <button type="button" className="btn btn-primary" onClick={capturePhoto}>Ambil Foto</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
