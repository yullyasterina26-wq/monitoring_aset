export function Loading({ message = 'Memuat data...' }) {
  return (
    <div className="loading-wrapper">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({ icon = '📋', message = 'Tidak ada data.' }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p>{message}</p>
    </div>
  );
}

export function Badge({ type = 'default', children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

export function kondisiBadge(kondisi) {
  const map = {
    'Baik': 'success',
    'Rusak': 'danger',
    'Di Pinjam': 'warning',
    'Dipinjam': 'warning',
    'Di Hapus': 'danger',
    'Dihapus': 'danger',
    'Maintenance': 'info',
    'Dalam Pemeliharaan': 'info',
    'Tidak Dapat Diperbaiki': 'danger',
  };
  return map[kondisi] || 'default';
}

export function Pagination({ currentPage, lastPage, total, from, to, onPageChange }) {
  if (lastPage <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(lastPage, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination">
      <div className="pagination-info">
        Menampilkan {from}–{to} dari {total} data
      </div>
      <div className="pagination-buttons">
        <button disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          ‹ Prev
        </button>
        {pages.map(p => (
          <button
            key={p}
            className={p === currentPage ? 'active' : ''}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button disabled={currentPage >= lastPage} onClick={() => onPageChange(currentPage + 1)}>
          Next ›
        </button>
      </div>
    </div>
  );
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatCurrency(val) {
  if (val == null || val === '') return '-';
  return 'Rp' + Number(val).toLocaleString('id-ID');
}
