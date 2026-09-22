import React, { useState } from 'react';
import { DistrictItem } from '../../../../services/bi-dashboard.service';

interface BiDistrictsTableProps {
  data: DistrictItem[];
  loading?: boolean;
  onSelectDistrict?: (distrito: string) => void;
  selectedDistrict?: string;
}

export const BiDistrictsTable: React.FC<BiDistrictsTableProps> = ({
  data,
  loading,
  onSelectDistrict,
  selectedDistrict,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof DistrictItem>('total');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: keyof DistrictItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredData = data
    .filter((d) => d.distrito.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  const totalIncidencias = data.reduce((acc, curr) => acc + curr.total, 0);
  const totalCruces = data.reduce((acc, curr) => acc + curr.crucesAfectados, 0);
  const totalResueltos = data.reduce((acc, curr) => acc + curr.resueltos, 0);
  const avgResolucion =
    totalIncidencias > 0 ? Math.round((totalResueltos / totalIncidencias) * 1000) / 10 : 0;

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-2 px-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h6 className="mb-0 text-dark fw-bold">
          <i className="fa-solid fa-map-location-dot text-primary me-2"></i>
          Distribución y Desempeño por Distrito
        </h6>
        <div className="d-flex align-items-center gap-2">
          <div className="input-group input-group-sm" style={{ width: '200px' }}>
            <span className="input-group-text bg-light border-end-0">
              <i className="fa-solid fa-magnifying-glass text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Buscar distrito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {selectedDistrict && (
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => onSelectDistrict && onSelectDistrict('')}
              title="Quitar filtro de distrito"
            >
              <i className="fa-solid fa-xmark me-1"></i>
              Limpiar
            </button>
          )}
        </div>
      </div>
      <div className="card-body p-0">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center text-muted p-4">
            <i className="fa-solid fa-circle-info fa-2x mb-2 d-block"></i>
            No se encontraron registros de distritos
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '340px' }}>
            <table className="table table-hover table-sm table-striped align-middle mb-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th
                    className="cursor-pointer text-nowrap px-3"
                    onClick={() => handleSort('distrito')}
                  >
                    Distrito{' '}
                    {sortField === 'distrito' && (
                      <i className={`fa-solid fa-arrow-${sortAsc ? 'up' : 'down'} ms-1 small`}></i>
                    )}
                  </th>
                  <th
                    className="text-end cursor-pointer text-nowrap"
                    onClick={() => handleSort('total')}
                  >
                    Incidencias{' '}
                    {sortField === 'total' && (
                      <i className={`fa-solid fa-arrow-${sortAsc ? 'up' : 'down'} ms-1 small`}></i>
                    )}
                  </th>
                  <th
                    className="text-end cursor-pointer text-nowrap"
                    onClick={() => handleSort('porcentajeTotal')}
                  >
                    % Part.{' '}
                    {sortField === 'porcentajeTotal' && (
                      <i className={`fa-solid fa-arrow-${sortAsc ? 'up' : 'down'} ms-1 small`}></i>
                    )}
                  </th>
                  <th
                    className="text-end cursor-pointer text-nowrap"
                    onClick={() => handleSort('crucesAfectados')}
                  >
                    Intersecciones{' '}
                    {sortField === 'crucesAfectados' && (
                      <i className={`fa-solid fa-arrow-${sortAsc ? 'up' : 'down'} ms-1 small`}></i>
                    )}
                  </th>
                  <th
                    className="text-end cursor-pointer text-nowrap"
                    onClick={() => handleSort('resueltos')}
                  >
                    Resueltas{' '}
                    {sortField === 'resueltos' && (
                      <i className={`fa-solid fa-arrow-${sortAsc ? 'up' : 'down'} ms-1 small`}></i>
                    )}
                  </th>
                  <th
                    className="text-center cursor-pointer text-nowrap px-3"
                    onClick={() => handleSort('tasaResolucion')}
                  >
                    % Resolución{' '}
                    {sortField === 'tasaResolucion' && (
                      <i className={`fa-solid fa-arrow-${sortAsc ? 'up' : 'down'} ms-1 small`}></i>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => {
                  const isSelected = selectedDistrict === item.distrito;
                  return (
                    <tr
                      key={item.distrito || idx}
                      className={isSelected ? 'table-primary fw-bold' : ''}
                      style={{ cursor: onSelectDistrict ? 'pointer' : 'default' }}
                      onClick={() => onSelectDistrict && onSelectDistrict(item.distrito === selectedDistrict ? '' : item.distrito)}
                    >
                      <td className="px-3">
                        <i className="fa-solid fa-location-dot text-secondary me-2 small"></i>
                        {item.distrito}
                      </td>
                      <td className="text-end fw-semibold">{item.total.toLocaleString()}</td>
                      <td className="text-end text-muted small">{item.porcentajeTotal}%</td>
                      <td className="text-end">{item.crucesAfectados}</td>
                      <td className="text-end text-success fw-semibold">{item.resueltos}</td>
                      <td className="px-3" style={{ minWidth: '130px' }}>
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <div className="progress flex-grow-1" style={{ height: '6px' }}>
                            <div
                              className={`progress-bar ${
                                item.tasaResolucion >= 80
                                  ? 'bg-success'
                                  : item.tasaResolucion >= 50
                                  ? 'bg-warning'
                                  : 'bg-danger'
                              }`}
                              role="progressbar"
                              style={{ width: `${Math.min(100, item.tasaResolucion)}%` }}
                              aria-valuenow={item.tasaResolucion}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            ></div>
                          </div>
                          <span className="small text-muted" style={{ minWidth: '38px', textAlign: 'right' }}>
                            {item.tasaResolucion}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="table-light fw-bold border-top">
                <tr>
                  <td className="px-3">TOTAL / PROMEDIO</td>
                  <td className="text-end">{totalIncidencias.toLocaleString()}</td>
                  <td className="text-end">100%</td>
                  <td className="text-end">{totalCruces}</td>
                  <td className="text-end text-success">{totalResueltos}</td>
                  <td className="text-center px-3 text-primary">{avgResolucion}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
