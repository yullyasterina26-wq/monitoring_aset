import { useEffect, useMemo, useState } from 'react';
import { HiOutlineSearch } from 'react-icons/hi';

const assetLabel = (asset) => `${asset.kode_aset || ''} - ${asset.nama_aset || ''}`.trim();

export default function SearchableAssetSelect({
  id,
  assets = [],
  value,
  onChange,
  selectedAsset = null,
  placeholder = 'Cari nama atau kode aset...',
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const selected = assets.find((asset) => String(asset.id) === String(value))
    || (selectedAsset && String(selectedAsset.id) === String(value) ? selectedAsset : null);

  useEffect(() => {
    setQuery(selected ? assetLabel(selected) : '');
  }, [value, selected]);

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery || (selected && query === assetLabel(selected))) return assets;
    return assets.filter((asset) => [
      asset.kode_aset,
      asset.nama_aset,
      asset.lokasi,
      asset.merek,
      asset.nomor_seri,
      asset.kategori?.nama_kategori,
      asset.kategori,
    ].filter(Boolean).join(' ').toLocaleLowerCase().includes(normalizedQuery));
  }, [assets, query, selected]);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') setIsOpen(false);
    if (event.key === 'Enter' && isOpen && filteredAssets.length) {
      event.preventDefault();
      const asset = filteredAssets[0];
      onChange(String(asset.id));
      setQuery(assetLabel(asset));
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <HiOutlineSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
        <input
          id={id}
          type="search"
          className="form-control"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-options`}
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => window.setTimeout(() => {
            setIsOpen(false);
            setQuery(selected ? assetLabel(selected) : '');
          }, 120)}
          style={{ paddingLeft: '38px' }}
        />
      </div>
      {isOpen && (
        <div
          id={`${id}-options`}
          role="listbox"
          style={{ position: 'absolute', zIndex: 20, top: 'calc(100% + 4px)', left: 0, right: 0, maxHeight: '220px', overflowY: 'auto', background: 'var(--white, #fff)', border: '1px solid var(--gray-200)', borderRadius: '8px', boxShadow: 'var(--shadow-md, 0 8px 20px rgba(15, 23, 42, .12))' }}
        >
          {filteredAssets.length ? filteredAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              role="option"
              aria-selected={String(asset.id) === String(value)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(String(asset.id));
                setQuery(assetLabel(asset));
                setIsOpen(false);
              }}
              style={{ display: 'block', width: '100%', padding: '9px 12px', border: 0, borderBottom: '1px solid var(--gray-100)', background: String(asset.id) === String(value) ? 'var(--primary-50)' : '#fff', color: 'var(--gray-800)', textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{assetLabel(asset)}</div>
              <div style={{ marginTop: '2px', fontSize: '0.73rem', color: 'var(--gray-500)' }}>
                {[asset.lokasi, asset.merek, asset.kondisi].filter(Boolean).join(' / ') || 'Aset'}
              </div>
            </button>
          )) : (
            <div style={{ padding: '12px', color: 'var(--gray-500)', fontSize: '0.82rem' }}>Aset tidak ditemukan.</div>
          )}
        </div>
      )}
    </div>
  );
}
