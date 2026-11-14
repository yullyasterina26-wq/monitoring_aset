import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineCube,
  HiOutlinePlusCircle,
  HiOutlineLightningBolt,
  HiOutlineQrcode,
  HiOutlineSwitchHorizontal,
  HiOutlineClipboardCheck,
  HiOutlineTrash,
} from 'react-icons/hi';

export default function QuickActions({
  onOpenScanModal,
  onOpenLoanModal,
  onOpenMutationModal,
  onOpenInspectionModal,
  onOpenDeletionModal,
}) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <div className={`card quick-actions-card${isAdmin ? '' : ' quick-actions-card--operator'}`}>
      <div className="card-header quick-actions-header">
        <HiOutlineLightningBolt className="quick-actions-title-icon" />
        <h2 className="quick-actions-title">
          Aksi Cepat Operasional
        </h2>
      </div>

      <div className="card-body quick-actions-grid">
        {/* Tombol 1: Pindai QR */}
        <button
          type="button"
          onClick={onOpenScanModal}
          className="quick-action-btn quick-action-btn--primary"
          data-mobile-label="Scan QR"
          id="btn-quick-scan-qr"
        >
          <HiOutlineQrcode />
          <span>Pindai QR Aset</span>
        </button>

        {/* Tombol 2: Katalog Aset */}
        <button
          type="button"
          onClick={() => navigate('/aset')}
          className="quick-action-btn quick-action-btn--secondary"
          data-mobile-label="Katalog"
          id="btn-quick-view-assets"
        >
          <HiOutlineCube />
          <span>Katalog Aset</span>
        </button>

        {!isAdmin && (
          <>
            {/* Tombol 3: Ajukan Peminjaman */}
            <button
              type="button"
              onClick={onOpenLoanModal}
              className="quick-action-btn quick-action-btn--secondary"
              data-mobile-label="Pinjam"
              id="btn-quick-loan"
            >
              <HiOutlinePlusCircle />
              <span>Ajukan Pinjam</span>
            </button>
            {/* Tombol 4: Ajukan Mutasi */}
            <button
              type="button"
              onClick={onOpenMutationModal}
              className="quick-action-btn quick-action-btn--secondary"
              data-mobile-label="Mutasi"
              id="btn-quick-mutation"
            >
              <HiOutlineSwitchHorizontal />
              <span>Ajukan Mutasi</span>
            </button>
          </>
        )}

        {/* Tombol 5: Catat Pemeriksaan */}
        <button
          type="button"
          onClick={onOpenInspectionModal}
          className="quick-action-btn quick-action-btn--secondary"
          data-mobile-label="Periksa"
          id="btn-quick-inspection"
        >
          <HiOutlineClipboardCheck />
          <span>Pemeriksaan Fisik</span>
        </button>

        {!isAdmin && (
          <button
            type="button"
            onClick={onOpenDeletionModal}
            className="quick-action-btn quick-action-btn--secondary"
            data-mobile-label="Hapus"
            id="btn-quick-deletion"
          >
            <HiOutlineTrash />
            <span>Ajukan Penghapusan</span>
          </button>
        )}
      </div>
    </div>
  );
}
