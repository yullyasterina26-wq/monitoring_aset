import { useNavigate } from 'react-router-dom';
import {
  HiOutlineCube,
  HiOutlinePlusCircle,
  HiOutlineLightningBolt,
  HiOutlineQrcode,
  HiOutlineSwitchHorizontal,
  HiOutlineClipboardCheck,
} from 'react-icons/hi';

export default function QuickActions({
  onOpenScanModal,
  onOpenLoanModal,
  onOpenMutationModal,
  onOpenInspectionModal,
}) {
  const navigate = useNavigate();

  return (
    <div
      className="card"
      style={{
        borderRadius: '12px',
        border: '1px solid var(--gray-200)',
        boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.05)',
        background: '#ffffff',
        marginBottom: '1.5rem',
      }}
    >
      <div
        className="card-header"
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--gray-100)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <HiOutlineLightningBolt style={{ fontSize: '18px', color: 'var(--primary-600)' }} />
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>
          Aksi Cepat Operasional
        </h2>
      </div>

      <div
        className="card-body"
        style={{
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '10px',
        }}
      >
        {/* Tombol 1: Pindai QR */}
        <button
          type="button"
          onClick={onOpenScanModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1e40af, #2563eb)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
          }}
          id="btn-quick-scan-qr"
        >
          <HiOutlineQrcode style={{ fontSize: '1.25rem' }} />
          <span>Pindai QR Aset</span>
        </button>

        {/* Tombol 2: Ajukan Peminjaman */}
        <button
          type="button"
          onClick={onOpenLoanModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'var(--primary-50)',
            color: 'var(--primary-700)',
            border: '1px solid var(--primary-200)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
          id="btn-quick-loan"
        >
          <HiOutlinePlusCircle style={{ fontSize: '1.25rem' }} />
          <span>Ajukan Pinjam</span>
        </button>

        {/* Tombol 3: Ajukan Mutasi */}
        <button
          type="button"
          onClick={onOpenMutationModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'var(--primary-50)',
            color: 'var(--primary-700)',
            border: '1px solid var(--primary-200)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
          id="btn-quick-mutation"
        >
          <HiOutlineSwitchHorizontal style={{ fontSize: '1.25rem' }} />
          <span>Ajukan Mutasi</span>
        </button>

        {/* Tombol 4: Catat Pemeriksaan */}
        <button
          type="button"
          onClick={onOpenInspectionModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'var(--primary-50)',
            color: 'var(--primary-700)',
            border: '1px solid var(--primary-200)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
          id="btn-quick-inspection"
        >
          <HiOutlineClipboardCheck style={{ fontSize: '1.25rem' }} />
          <span>Pemeriksaan</span>
        </button>

        {/* Tombol 5: Data Aset */}
        <button
          type="button"
          onClick={() => navigate('/aset')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'var(--gray-50)',
            color: 'var(--gray-700)',
            border: '1px solid var(--gray-200)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
          id="btn-quick-view-assets"
        >
          <HiOutlineCube style={{ fontSize: '1.25rem' }} />
          <span>Katalog Aset</span>
        </button>
      </div>
    </div>
  );
}
