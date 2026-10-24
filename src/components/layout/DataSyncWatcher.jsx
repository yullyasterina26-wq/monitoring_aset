import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

function userIsEditing() {
  const active = document.activeElement;
  const typing = active && active.matches('input:not([type="button"]):not([type="submit"]), textarea, select, [contenteditable="true"]');
  const modalOpen = Boolean(document.querySelector('.modal-backdrop'));
  const fileSelected = Array.from(document.querySelectorAll('input[type="file"]')).some((input) => input.files?.length);
  return Boolean(typing || modalOpen || fileSelected);
}

export default function DataSyncWatcher() {
  const version = useRef(null);
  const [updateWaiting, setUpdateWaiting] = useState(false);

  useEffect(() => {
    let active = true;
    const checkVersion = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const response = await api.get('/sync/version', { params: { _: Date.now() } });
        if (!active) return;
        const current = response.data?.version;
        if (!current) return;
        if (!version.current) {
          version.current = current;
          return;
        }
        if (current === version.current) return;
        version.current = current;
        if (userIsEditing()) setUpdateWaiting(true);
        else window.location.reload();
      } catch (error) {
        // Koneksi sinkronisasi sementara terputus; permintaan berikutnya mencoba lagi.
        console.debug('Pemeriksaan sinkronisasi tertunda:', error?.message || error);
      }
    };

    checkVersion();
    const timer = window.setInterval(checkVersion, 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!updateWaiting) return undefined;
    const timer = window.setInterval(() => {
      if (!userIsEditing()) window.location.reload();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [updateWaiting]);

  if (!updateWaiting) return null;
  return (
    <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: '#0f223d', color: '#fff', boxShadow: '0 6px 24px #0003' }}>
      <span>Perubahan terbaru tersedia. Halaman akan diperbarui setelah formulir ditutup.</span>
      <button type="button" onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Perbarui sekarang</button>
    </div>
  );
}
