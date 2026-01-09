import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
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
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Inicio />
                </Layout>
              </ProtectedRoute>
            }
          />
        <Route
          path="/incidents"
          element={
            <ProtectedRoute>
              <Layout>
                <IncidentsList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents/new"
          element={
            <ProtectedRoute>
              <Layout>
                <IncidentForm incidentId={null} onClose={() => {}} onSave={() => {}} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <IncidentForm incidentId={null} onClose={() => {}} onSave={() => {}} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <IncidentDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cruces"
          element={
            <ProtectedRoute>
              <Layout>
                <CrucesList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cruces/mapa"
          element={
            <ProtectedRoute>
              <Layout>
                <CrucesMap />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cruces/new"
          element={
            <ProtectedRoute>
              <Layout>
                <CruceForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cruces/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <CruceForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cruces/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <CruceDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes/incidencias"
          element={
            <ProtectedRoute>
              <Layout>
                <ReporteIncidencias />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes/grafico"
          element={
            <ProtectedRoute>
              <Layout>
                <ReporteGrafico />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes/mapa"
          element={
            <ProtectedRoute>
              <Layout>
                <MapaCalor />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UsersManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/grupos"
          element={
            <ProtectedRoute>
              <Layout>
                <GruposPermisosManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/catalogos"
          element={
            <ProtectedRoute>
              <Layout>
                <CatalogosManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos/tipos"
          element={
            <ProtectedRoute>
              <Layout>
                <CatalogosManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos/areas"
          element={
            <ProtectedRoute>
              <Layout>
                <AreasManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos/equipos"
          element={
            <ProtectedRoute>
              <Layout>
                <EquiposManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos/reportadores"
          element={
            <ProtectedRoute>
              <Layout>
                <ReportadoresManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos/responsables"
          element={
            <ProtectedRoute>
              <Layout>
                <ResponsablesManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos/administradores"
          element={
            <ProtectedRoute>
              <Layout>
                <AdministradoresManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos/ejes"
          element={
            <ProtectedRoute>
              <Layout>
                <EjesManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos/proyectos"
          element={
            <ProtectedRoute>
              <Layout>
                <ProyectosManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos/incidencias"
          element={
            <ProtectedRoute>
              <Layout>
                <IncidenciasManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Layout>
                <MiPerfil />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracion"
          element={
            <ProtectedRoute>
              <Layout>
                <Configuracion />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
