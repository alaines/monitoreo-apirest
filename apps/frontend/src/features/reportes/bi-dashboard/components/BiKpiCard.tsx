import React from 'react';

interface BiKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  iconBgColor?: string;
  iconColor?: string;
  badgeText?: string;
  badgeBg?: string;
  progressPercent?: number;
}

export const BiKpiCard: React.FC<BiKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'rgba(29, 84, 109, 0.1)',
  iconColor = '#1D546D',
  badgeText,
  badgeBg = 'bg-primary',
  progressPercent,
}) => {
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
              backgroundColor: iconBgColor,
              color: iconColor,
            }}
          >
            <i className={`${icon} fs-6`}></i>
          </div>
        </div>

        <div className="d-flex align-items-baseline justify-content-between">
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
              className={`progress-bar ${badgeBg.replace('bg-', 'bg-')}`}
              role="progressbar"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
        )}

        {subtitle && (
          <div className="text-muted mt-1" style={{ fontSize: '11px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
