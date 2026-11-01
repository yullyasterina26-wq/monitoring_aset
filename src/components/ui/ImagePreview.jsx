import { useState } from 'react';

export default function ImagePreview({ src, alt = 'Foto bukti', imageStyle = {}, buttonStyle = {}, title = 'Klik untuk memperbesar foto' }) {
  const [open, setOpen] = useState(false);
  if (!src) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Perbesar ${alt.toLowerCase()}`}
        title={title}
        style={{ display: 'inline-block', padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in', lineHeight: 0, ...buttonStyle }}
      >
        <img src={src} alt={alt} style={imageStyle} />
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)} style={{ zIndex: 1300 }}>
          <div className="modal-dialog" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 'min(900px, 94vw)', width: 'fit-content' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{alt}</h3>
              <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Tutup pratinjau">×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#111', padding: '12px' }}>
              <img src={src} alt={alt} style={{ display: 'block', maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '6px' }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
