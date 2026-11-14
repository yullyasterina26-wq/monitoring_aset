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
    indigo: {
      bg: '#e0e7ff',
      text: '#4f46e5',
      border: '#c7d2fe',
      badgeBg: '#e0e7ff',
      badgeText: '#3730a3',
    },
    rose: {
      bg: '#ffe4e6',
      text: '#e11d48',
      border: '#fecdd3',
      badgeBg: '#ffe4e6',
      badgeText: '#9f1239',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`stat-card-custom${onClick ? ' is-clickable' : ''} stat-card-custom--${color}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
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
          e.currentTarget.style.boxShadow = '';
        }
      }}
    >
      <div className="stat-card-header">
        <div className="stat-card-info">
          <span className="stat-card-title">
            {title}
          </span>
          <div className="stat-card-value">
            {typeof value === 'number' ? value.toLocaleString('id-ID') : value ?? 0}
          </div>
        </div>

        {Icon && (
          <div
            className="stat-card-icon"
            style={{
              background: scheme.bg,
              color: scheme.text,
            }}
          >
            <Icon />
          </div>
        )}
      </div>

      {(description || badgeText) && (
        <div className="stat-card-meta">
          {badgeText && (
            <span
              className="stat-card-badge"
              style={{
                background: scheme.badgeBg,
                color: scheme.badgeText,
              }}
            >
              {badgeText}
            </span>
          )}
          {description && (
            <span className="stat-card-desc">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
