import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './features/auth/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './features/auth/pages/LoginPage';
import { Layout } from './components/Layout';
import { Inicio } from './pages/Inicio';

// Lazy load de componentes
const IncidentsList = lazy(() => import('./features/incidents/IncidentsList').then(m => ({ default: m.IncidentsList })));
const IncidentForm = lazy(() => import('./features/incidents/IncidentForm').then(m => ({ default: m.IncidentForm })));
const IncidentDetail = lazy(() => import('./features/incidents/IncidentDetail').then(m => ({ default: m.IncidentDetail })));
const CrucesList = lazy(() => import('./features/cruces/CrucesList').then(m => ({ default: m.CrucesList })));
const CruceForm = lazy(() => import('./features/cruces/CruceForm').then(m => ({ default: m.CruceForm })));
const CruceDetail = lazy(() => import('./features/cruces/CruceDetail').then(m => ({ default: m.CruceDetail })));
const CrucesMap = lazy(() => import('./features/cruces/CrucesMap').then(m => ({ default: m.CrucesMap })));
const ReporteIncidencias = lazy(() => import('./features/reportes/ReporteIncidencias').then(m => ({ default: m.ReporteIncidencias })));
const ReporteGrafico = lazy(() => import('./features/reportes/ReporteGrafico'));
const MapaCalor = lazy(() => import('./features/reportes/MapaCalor').then(m => ({ default: m.MapaCalor })));
const UsersManagement = lazy(() => import('./features/admin/users/UsersManagement').then(m => ({ default: m.UsersManagement })));
const GruposPermisosManagement = lazy(() => import('./features/admin/grupos/GruposPermisosManagement').then(m => ({ default: m.GruposPermisosManagement })));
const MenusManagement = lazy(() => import('./features/admin/menus/MenusManagement').then(m => ({ default: m.MenusManagement })));
const CatalogosManagement = lazy(() => import('./features/admin/catalogos/CatalogosManagement').then(m => ({ default: m.CatalogosManagement })));
const AreasManagement = lazy(() => import('./features/mantenimientos/areas/AreasManagement'));
const EquiposManagement = lazy(() => import('./features/mantenimientos/equipos/EquiposManagement'));
const ReportadoresManagement = lazy(() => import('./features/mantenimientos/reportadores/ReportadoresManagement'));
const ResponsablesManagement = lazy(() => import('./features/mantenimientos/responsables/ResponsablesManagement'));
const AdministradoresManagement = lazy(() => import('./features/mantenimientos/administradores/AdministradoresManagement'));
const EjesManagement = lazy(() => import('./features/mantenimientos/ejes/EjesManagement'));
const ProyectosManagement = lazy(() => import('./features/mantenimientos/proyectos/ProyectosManagement'));
const IncidenciasManagement = lazy(() => import('./features/mantenimientos/incidencias/IncidenciasManagement'));
const MiPerfil = lazy(() => import('./features/perfil/MiPerfil').then(m => ({ default: m.MiPerfil })));
const Configuracion = lazy(() => import('./features/configuracion/Configuracion').then(m => ({ default: m.Configuracion })));

// Componente que combina ProtectedRoute y Layout para evitar re-renders
function ProtectedLayout() {
  const LoadingContent = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<LoadingContent />}>
          <Outlet />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

function App() {
  const { initialize, isAuthenticated } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initialize();
    setIsInitialized(true);
  }, [initialize]);

  const LoadingFallback = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  );

  if (!isInitialized) {
    return <LoadingFallback />;
  }

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        
        {/* Rutas protegidas con Layout compartido */}
        <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/incidents" element={<IncidentsList />} />
            <Route path="/incidents/new" element={<IncidentForm incidentId={null} onClose={() => {}} onSave={() => {}} />} />
            <Route path="/incidents/:id/edit" element={<IncidentForm incidentId={null} onClose={() => {}} onSave={() => {}} />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/cruces" element={<CrucesList />} />
            <Route path="/cruces/mapa" element={<CrucesMap />} />
            <Route path="/cruces/new" element={<CruceForm />} />
            <Route path="/cruces/:id/edit" element={<CruceForm />} />
            <Route path="/cruces/:id" element={<CruceDetail />} />
            <Route path="/reportes/incidencias" element={<ReporteIncidencias />} />
            <Route path="/reportes/grafico" element={<ReporteGrafico />} />
            <Route path="/reportes/mapa" element={<MapaCalor />} />
            <Route path="/admin/users" element={<UsersManagement />} />
            <Route path="/admin/grupos" element={<GruposPermisosManagement />} />
            <Route path="/admin/menus" element={<MenusManagement />} />
            <Route path="/admin/catalogos" element={<CatalogosManagement />} />
            <Route path="/mantenimientos/tipos" element={<CatalogosManagement />} />
            <Route path="/mantenimientos/areas" element={<AreasManagement />} />
            <Route path="/mantenimientos/equipos" element={<EquiposManagement />} />
            <Route path="/mantenimientos/reportadores" element={<ReportadoresManagement />} />
            <Route path="/mantenimientos/responsables" element={<ResponsablesManagement />} />
            <Route path="/mantenimientos/administradores" element={<AdministradoresManagement />} />
            <Route path="/mantenimientos/ejes" element={<EjesManagement />} />
            <Route path="/mantenimientos/proyectos" element={<ProyectosManagement />} />
            <Route path="/mantenimientos/incidencias" element={<IncidenciasManagement />} />
            <Route path="/perfil" element={<MiPerfil />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
