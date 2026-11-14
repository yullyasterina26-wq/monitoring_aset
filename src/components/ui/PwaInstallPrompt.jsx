import { useEffect, useState } from 'react';
import { HiOutlineDownload, HiOutlineX } from 'react-icons/hi';

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleInstallAvailable = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleInstallAvailable);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallAvailable);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (!installPrompt || installed) return null;

  const install = async () => {
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <aside className="pwa-install-prompt" aria-label="Instal aplikasi SIMA">
      <div>
        <strong>Pasang SIMA Aset</strong>
        <span>Akses monitoring lebih cepat dari perangkat ini.</span>
      </div>
      <button type="button" className="btn btn-primary" onClick={install}>
        <HiOutlineDownload aria-hidden="true" />
        Pasang
      </button>
      <button
        type="button"
        className="pwa-install-dismiss"
        onClick={() => setInstallPrompt(null)}
        aria-label="Tutup saran pemasangan"
      >
        <HiOutlineX aria-hidden="true" />
      </button>
    </aside>
  );
}
