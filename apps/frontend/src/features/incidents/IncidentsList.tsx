import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  Stack,
  Autocomplete,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import { incidentsService, Incident, IncidenciaCatalog, CruceCatalog } from '../../services/incidents.service';
import { IncidentDetail } from './IncidentDetail';
import { IncidentForm } from './IncidentForm';

const estadoColors: Record<number, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  1: 'warning',  // Pendiente
  2: 'primary',  // En proceso
  3: 'success',  // Completado
  4: 'error',    // Cancelado
};

const estadoLabels: Record<number, string> = {
  1: 'Pendiente',
  2: 'En Proceso',
  3: 'Completado',
  4: 'Cancelado',
};

export function IncidentsList() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [incidencias, setIncidencias] = useState<IncidenciaCatalog[]>([]);
  const [cruces, setCruces] = useState<CruceCatalog[]>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);
  const [filters, setFilters] = useState({
    cruceId: '',
    estadoId: '',
    incidenciaId: '',
  });
  const [selectedIncidencia, setSelectedIncidencia] = useState<IncidenciaCatalog | null>(null);
  const [selectedCruce, setSelectedCruce] = useState<CruceCatalog | null>(null);
  
  // Estados para modales
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    loadIncidencias();
    loadCruces();
  }, []);

  const loadIncidencias = async () => {
    try {
      const data = await incidentsService.getIncidenciasCatalog();
      setIncidencias(data);
    } catch (error) {
      console.error('Error loading incidencias:', error);
    }
  };

  const loadCruces = async () => {
    try {
      const data = await incidentsService.getCrucesCatalog();
      setCruces(data);
    } catch (error) {
      console.error('Error loading cruces:', error);
    }
  };

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const response = await incidentsService.getIncidents({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        cruceId: filters.cruceId ? parseInt(filters.cruceId) : undefined,
        estadoId: filters.estadoId ? parseInt(filters.estadoId) : undefined,
        incidenciaId: filters.incidenciaId ? parseInt(filters.incidenciaId) : undefined,
      });
      setIncidents(response.data);
      setRowCount(response.meta.total);
    } catch (error) {
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [paginationModel, filters]);

  useEffect(() => {
    loadIncidents();
  }, [paginationModel]);

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
    },
    {
      field: 'cruce',
      headerName: 'Intersección/Cruce',
      flex: 1,
      minWidth: 200,
      valueGetter: (value: any) => value?.nombre || value?.codigo || 'Sin especificar',
    },
    {
      field: 'incidencia',
      headerName: 'Tipo',
      width: 150,
      valueGetter: (value: any) => value?.tipo || 'N/A',
    },
    {
      field: 'descripcion',
      headerName: 'Descripción',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'estadoId',
      headerName: 'Estado',
      width: 130,
      renderCell: (params) => {
        const estadoId = params.value || 1;
        return (
          <Chip
            label={estadoLabels[estadoId] || 'Desconocido'}
            color={estadoColors[estadoId] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'equipo',
      headerName: 'Equipo',
      width: 150,
      valueGetter: (value: any) => value?.nombre || 'Sin asignar',
    },
    {
      field: 'reportadorNombres',
      headerName: 'Reportador',
      width: 150,
    },
    {
      field: 'createdAt',
      headerName: 'Fecha',
      width: 110,
      valueFormatter: (params) => {
        if (!params) return '';
        return new Date(params).toLocaleDateString('es-PE');
      },
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setSelectedIncidentId(params.row.id);
              setDetailModalOpen(true);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="info"
            onClick={() => {
              setSelectedIncidentId(params.row.id);
              setFormMode('edit');
              setFormModalOpen(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Incidencias
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedIncidentId(null);
            setFormMode('create');
            setFormModalOpen(true);
          }}
        >
          Nueva Incidencia
        </Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Autocomplete
              size="small"
              options={cruces}
              getOptionLabel={(option) => option.nombre}
              value={selectedCruce}
              onChange={(_, newValue) => {
                setSelectedCruce(newValue);
                setFilters({ ...filters, cruceId: newValue?.id.toString() || '' });
              }}
              sx={{ flex: 1, minWidth: 200 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cruce o Intersección"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <SearchIcon sx={{ ml: 1, mr: -0.5, color: 'action.active' }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <TextField
              select
              size="small"
              label="Estado"
              value={filters.estadoId}
              onChange={(e) => setFilters({ ...filters, estadoId: e.target.value })}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="1">Pendiente</MenuItem>
              <MenuItem value="2">En Proceso</MenuItem>
              <MenuItem value="3">Completado</MenuItem>
              <MenuItem value="4">Cancelado</MenuItem>
            </TextField>
            <Autocomplete
              size="small"
              options={incidencias}
              getOptionLabel={(option) => option.tipo}
              value={selectedIncidencia}
              onChange={(_, newValue) => {
                setSelectedIncidencia(newValue);
                setFilters({ ...filters, incidenciaId: newValue?.id.toString() || '' });
              }}
              sx={{ flex: 1, minWidth: 300 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tipo de Incidencia"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <FilterListIcon sx={{ ml: 1, mr: -0.5, color: 'action.active' }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DataGrid
            rows={incidents}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25, 50]}
            rowCount={rowCount}
            loading={loading}
            paginationMode="server"
            disableRowSelectionOnClick
            autoHeight
            sx={{
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Modal para visualizar detalle */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Detalle de Incidencia
          <IconButton
            aria-label="close"
            onClick={() => setDetailModalOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedIncidentId && (
            <IncidentDetail
              incidentId={selectedIncidentId}
              onClose={() => setDetailModalOpen(false)}
              onEdit={(id) => {
                setDetailModalOpen(false);
                setSelectedIncidentId(id);
                setFormMode('edit');
                setFormModalOpen(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para crear/editar */}
      <Dialog
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {formMode === 'create' ? 'Nueva Incidencia' : 'Editar Incidencia'}
          <IconButton
            aria-label="close"
            onClick={() => setFormModalOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <IncidentForm
            incidentId={selectedIncidentId}
            onClose={() => setFormModalOpen(false)}
            onSave={() => {
              setFormModalOpen(false);
              loadIncidents();
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
