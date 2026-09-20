import React from 'react';

export interface PageHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="app-page-title mb-3">
      <div className="page-title-wrapper d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="page-title-heading d-flex align-items-center">
          <div className="page-title-icon me-3">
            <i className={icon}></i>
          </div>
          <div>
            <h4 className="page-title-title mb-0 fw-bold text-dark">{title}</h4>
            {subtitle && (
              <div className="page-title-subheading text-muted small">{subtitle}</div>
            )}
          </div>
        </div>
        {actions && (
          <div className="page-title-actions d-flex gap-2 align-items-center flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
