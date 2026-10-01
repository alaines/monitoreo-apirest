import React from 'react';

const VARIANT_COLORS: Record<string, { bg: string; color: string; barBg: string }> = {
  primary: { bg: 'rgba(29, 84, 109, 0.12)', color: '#1D546D', barBg: 'bg-primary' },
  secondary: { bg: 'rgba(95, 149, 152, 0.15)', color: '#5F9598', barBg: 'bg-secondary' },
  success: { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669', barBg: 'bg-success' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', color: '#d97706', barBg: 'bg-warning' },
  danger: { bg: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', barBg: 'bg-danger' },
  info: { bg: 'rgba(6, 182, 212, 0.15)', color: '#0891b2', barBg: 'bg-info' },
};

interface BiKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtext?: string;
  icon: string;
  iconBgColor?: string;
  iconColor?: string;
  colorVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | string;
  badgeText?: string;
  badgeBg?: string;
  progressPercent?: number;
}

export const BiKpiCard: React.FC<BiKpiCardProps> = ({
  title,
  value,
  subtitle,
  subtext,
  icon,
  iconBgColor,
  iconColor,
  colorVariant,
  badgeText,
  badgeBg = 'bg-primary',
  progressPercent,
}) => {
  const variantConfig = colorVariant && VARIANT_COLORS[colorVariant] ? VARIANT_COLORS[colorVariant] : null;
  const resolvedBg = iconBgColor || variantConfig?.bg || 'rgba(29, 84, 109, 0.1)';
  const resolvedColor = iconColor || variantConfig?.color || '#1D546D';
  const effectiveSubtitle = subtitle || subtext;

  return (
    <div className="card h-100 border shadow-sm" style={{ minHeight: '120px' }}>
      <div className="card-body p-3 d-flex flex-column justify-content-between">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
            {title}
          </span>
          <div
            className="rounded-3 d-flex align-items-center justify-content-center"
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: resolvedBg,
              color: resolvedColor,
            }}
          >
            <i className={`${icon} fs-6`}></i>
          </div>
        </div>

        <div className="d-flex align-items-baseline justify-content-between flex-wrap gap-1">
          <div className="fs-3 fw-bold text-dark">
            {typeof value === 'number' ? value.toLocaleString('es-PE') : value}
          </div>
          {badgeText && (
            <span className={`badge ${badgeBg} rounded-pill px-2 py-1`} style={{ fontSize: '11px' }}>
              {badgeText}
            </span>
          )}
        </div>

        {progressPercent !== undefined && (
          <div className="progress mt-2" style={{ height: '5px' }}>
            <div
              className={`progress-bar ${variantConfig?.barBg || badgeBg}`}
              role="progressbar"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
        )}

        {effectiveSubtitle && (
          <div className="text-muted mt-1" style={{ fontSize: '11px' }}>
            {effectiveSubtitle}
          </div>
        )}
      </div>
    </div>
  );
};

