import { useEffect, useState } from 'react';
import api from '../../services/api';
import ImagePreview from './ImagePreview';

export default function ProtectedInspectionPhoto({
  inspectionId,
  imageStyle = {},
  buttonStyle = {},
}) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    api.get(`/operasional/pemeriksaan/${inspectionId}/photo`, { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data);
        setPhotoUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [inspectionId]);

  if (failed) return <span style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Foto tidak dapat dimuat.</span>;
  if (!photoUrl) return <span style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Memuat foto...</span>;

  return (
    <ImagePreview
      src={photoUrl}
      alt="Foto bukti pemeriksaan"
      imageStyle={imageStyle}
      buttonStyle={buttonStyle}
    />
  );
}
