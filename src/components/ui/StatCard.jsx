export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  badgeText,
  color = 'blue',
  onClick,
}) {
  const colorMap = {
    blue: {
      bg: 'var(--primary-50)',
      text: 'var(--primary-600)',
      border: 'var(--primary-200)',
      badgeBg: 'var(--primary-100)',
      badgeText: 'var(--primary-800)',
    },
    green: {
      bg: 'var(--success-bg)',
      text: 'var(--success)',
      border: '#a7f3d0',
      badgeBg: '#d1fae5',
      badgeText: '#065f46',
    },
    amber: {
      bg: 'var(--warning-bg)',
      text: 'var(--warning)',
      border: '#fde68a',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
    },
    purple: {
      bg: '#f3e8ff',
      text: '#9333ea',
      border: '#e9d5ff',
      badgeBg: '#f3e8ff',
      badgeText: '#6b21a8',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      className="stat-card-custom"
      onClick={onClick}
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        border: '1px solid var(--gray-200)',
        boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 16px -2px rgba(0, 0, 0, 0.08)';
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 2px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-500)', letterSpacing: '0.2px' }}>
            {title}
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: '0.25rem', lineHeight: 1.1 }}>
            {typeof value === 'number' ? value.toLocaleString('id-ID') : value ?? 0}
          </div>
        </div>

        {Icon && (
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: scheme.bg,
              color: scheme.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0,
            }}
          >
            <Icon />
          </div>
        )}
      </div>

      {(description || badgeText) && (
        <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
          {badgeText && (
            <span
              style={{
                background: scheme.badgeBg,
                color: scheme.badgeText,
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              {badgeText}
            </span>
          )}
          {description && (
            <span style={{ color: 'var(--gray-500)' }}>{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
