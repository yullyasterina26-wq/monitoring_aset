import { Link } from 'react-router-dom';
import { HiOutlineCube, HiOutlineCheck } from 'react-icons/hi';
import { Badge, Loading } from './Shared';

export default function AssetTable({
  assets = [],
  loading = false,
  onSelectAsset,
  onViewDetail,
}) {
  return (
    <div
      className="card"
      style={{
        borderRadius: '12px',
        border: '1px solid var(--gray-200)',
        boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        background: '#ffffff',
      }}
    >
      <div
        className="card-header"
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--gray-100)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiOutlineCube style={{ fontSize: '18px', color: 'var(--primary-600)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>
            Aset Tersedia untuk Dipinjam
          </h2>
        </div>

        <Link
          to="/aset"
          style={{
            fontSize: '0.85rem',
            color: 'var(--primary-600)',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          id="link-pilih-aset"
        >
          Pilih aset &rarr;
        </Link>
      </div>

      <div className="card-body" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <Loading message="Memuat aset tersedia..." />
          </div>
        ) : assets.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: 'var(--gray-500)',
              fontSize: '0.9rem',
            }}
          >
            <HiOutlineCube style={{ fontSize: '2.5rem', color: 'var(--gray-300)', marginBottom: '0.5rem' }} />
            <p style={{ margin: 0 }}>Tidak ada aset tersedia.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Kode</th>
                  <th>Nama Aset</th>
                  <th>Kategori</th>
                  {onSelectAsset && <th style={{ width: '110px', textAlign: 'center' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr
                    key={asset.id}
                    onClick={() => onViewDetail?.(asset)}
                    onKeyDown={(event) => {
                      if (onViewDetail && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        onViewDetail(asset);
                      }
                    }}
                    tabIndex={onViewDetail ? 0 : undefined}
                    style={{ cursor: onViewDetail ? 'pointer' : undefined }}
                    title={onViewDetail ? 'Klik baris untuk melihat detail aset' : undefined}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--primary-600)', fontSize: '0.85rem' }}>
                      {asset.kode_aset}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--gray-800)' }}>
                      <div>{asset.nama_aset}</div>
                      {asset.lokasi && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                          Lokasi: {asset.lokasi}
                        </span>
                      )}
                    </td>
                    <td>
                      <Badge type="info">
                        {asset.kategori?.nama_kategori || asset.kategori || 'Perangkat'}
                      </Badge>
                    </td>
                    {onSelectAsset && <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {onSelectAsset && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => onSelectAsset(asset)}
                            style={{
                              padding: '4px 12px',
                              fontSize: '0.8rem',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Pinjam Aset Ini"
                          >
                            <HiOutlineCheck /> Pinjam
                          </button>
                        )}
                      </div>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
