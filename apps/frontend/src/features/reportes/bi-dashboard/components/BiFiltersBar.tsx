import React from 'react';
import Select from 'react-select';
import { customSelectStylesSmall } from '../../../../styles/react-select-custom';
import { BiFilterOptions, QueryBiDashboardDto } from '../../../../services/bi-dashboard.service';

interface BiFiltersBarProps {
  filterOptions?: BiFilterOptions;
  filters: QueryBiDashboardDto;
  onFilterChange: (newFilters: QueryBiDashboardDto) => void;
  loading?: boolean;
}

export const BiFiltersBar: React.FC<BiFiltersBarProps> = ({
  filterOptions,
  filters,
  onFilterChange,
  loading = false,
}) => {
  const currentYear = new Date().getFullYear();

  const years = filterOptions?.years && filterOptions.years.length > 0 ? filterOptions.years : [currentYear];
  const months = filterOptions?.months || [];
  const distritos = filterOptions?.distritos || [];
  const administradores = filterOptions?.administradores || [];
  const equipos = filterOptions?.equipos || [];

  const handleReset = () => {
    onFilterChange({ anho: currentYear });
  };

  const hasActiveFilters = Boolean(
    filters.mes ||
    filters.distrito ||
    filters.administradorId ||
    filters.equipoId ||
    filters.prioridadId ||
    filters.caracteristica
  );

  return (
    <div className="card mb-3 border shadow-sm">
      <div className="card-header bg-white border-bottom py-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center">
          <i className="fa-solid fa-filter text-primary me-2"></i>
          <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>
            Segmentación y Filtros de Análisis
          </span>
          {hasActiveFilters && (
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle ms-2 small">
              Filtros activos
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleReset}
            disabled={loading}
            title="Limpiar filtros"
            style={{ fontSize: '12px' }}
          >
            <i className="fa-solid fa-eraser me-1"></i> Restablecer Filtros
          </button>
        )}
      </div>
      <div className="card-body p-3">
        <div className="row g-2">
          {/* Año */}
          <div className="col-md-2 col-sm-6">
            <label className="form-label mb-1 text-muted small fw-semibold">Año</label>
            <Select
              options={years.map((y) => ({ value: y, label: y.toString() }))}
              value={{
                value: filters.anho || currentYear,
                label: (filters.anho || currentYear).toString(),
              }}
              onChange={(opt) => onFilterChange({ ...filters, anho: opt?.value || currentYear })}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
              menuPosition="fixed"
              styles={customSelectStylesSmall}
              isSearchable={false}
              isDisabled={loading}
            />
          </div>

          {/* Mes */}
          <div className="col-md-2 col-sm-6">
            <label className="form-label mb-1 text-muted small fw-semibold">Mes</label>
            <Select
              options={[
                { value: 0, label: 'Todos los meses' },
                ...months.map((m) => ({ value: m.id, label: m.name })),
              ]}
              value={
                filters.mes
                  ? {
                      value: filters.mes,
                      label: months.find((m) => m.id === filters.mes)?.name || `Mes ${filters.mes}`,
                    }
                  : { value: 0, label: 'Todos los meses' }
              }
              onChange={(opt) => {
                const mesVal = opt?.value ? Number(opt.value) : undefined;
                onFilterChange({ ...filters, mes: mesVal === 0 ? undefined : mesVal });
              }}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
              menuPosition="fixed"
              styles={customSelectStylesSmall}
              isSearchable={true}
              isDisabled={loading}
            />
          </div>

          {/* Distrito */}
          <div className="col-md-3 col-sm-6">
            <label className="form-label mb-1 text-muted small fw-semibold">Distrito</label>
            <Select
              options={[
                { value: '', label: 'Todos los distritos' },
                ...distritos.map((d) => ({ value: d, label: d })),
              ]}
              value={
                filters.distrito
                  ? { value: filters.distrito, label: filters.distrito }
                  : { value: '', label: 'Todos los distritos' }
              }
              onChange={(opt) => {
                const distVal = opt?.value ? String(opt.value) : undefined;
                onFilterChange({ ...filters, distrito: distVal === '' ? undefined : distVal });
              }}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
              menuPosition="fixed"
              styles={customSelectStylesSmall}
              isSearchable={true}
              placeholder="Buscar distrito..."
              isDisabled={loading}
            />
          </div>

          {/* Administrador */}
          <div className="col-md-2 col-sm-6">
            <label className="form-label mb-1 text-muted small fw-semibold">Administrador</label>
            <Select
              options={[
                { value: 0, label: 'Todos los administradores' },
                ...administradores.map((a) => ({ value: a.id, label: a.nombre })),
              ]}
              value={
                filters.administradorId
                  ? {
                      value: filters.administradorId,
                      label:
                        administradores.find((a) => a.id === filters.administradorId)?.nombre ||
                        'Todos los administradores',
                    }
                  : { value: 0, label: 'Todos los administradores' }
              }
              onChange={(opt) => {
                const admVal = opt?.value ? Number(opt.value) : undefined;
                onFilterChange({ ...filters, administradorId: admVal === 0 ? undefined : admVal });
              }}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
              menuPosition="fixed"
              styles={customSelectStylesSmall}
              isSearchable={true}
              isDisabled={loading}
            />
          </div>

          {/* Equipo Responsable */}
          <div className="col-md-3 col-sm-6">
            <label className="form-label mb-1 text-muted small fw-semibold">Equipo de Trabajo</label>
            <Select
              options={[
                { value: 0, label: 'Todos los equipos' },
                ...equipos.map((e) => ({ value: e.id, label: e.nombre })),
              ]}
              value={
                filters.equipoId
                  ? {
                      value: filters.equipoId,
                      label: equipos.find((e) => e.id === filters.equipoId)?.nombre || 'Todos los equipos',
                    }
                  : { value: 0, label: 'Todos los equipos' }
              }
              onChange={(opt) => {
                const eqVal = opt?.value ? Number(opt.value) : undefined;
                onFilterChange({ ...filters, equipoId: eqVal === 0 ? undefined : eqVal });
              }}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
              menuPosition="fixed"
              styles={customSelectStylesSmall}
              isSearchable={true}
              isDisabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
