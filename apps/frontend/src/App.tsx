import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './features/auth/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './features/auth/pages/LoginPage';
import { Layout } from './components/Layout';
import { Inicio } from './pages/Inicio';
import { IncidentsList } from './features/incidents/IncidentsList';
import { IncidentForm } from './features/incidents/IncidentForm';
import { IncidentDetail } from './features/incidents/IncidentDetail';
import { CrucesList } from './features/cruces/CrucesList';
import { CruceForm } from './features/cruces/CruceForm';
import { CruceDetail } from './features/cruces/CruceDetail';
import { CrucesMap } from './features/cruces/CrucesMap';
import { ReporteIncidencias } from './features/reportes/ReporteIncidencias';
import ReporteGrafico from './features/reportes/ReporteGrafico';
import { MapaCalor } from './features/reportes/MapaCalor';
import { UsersManagement } from './features/admin/users/UsersManagement';
import { GruposPermisosManagement } from './features/admin/grupos/GruposPermisosManagement';
import { CatalogosManagement } from './features/admin/catalogos/CatalogosManagement';
import AreasManagement from './features/mantenimientos/areas/AreasManagement';
import EquiposManagement from './features/mantenimientos/equipos/EquiposManagement';
import ReportadoresManagement from './features/mantenimientos/reportadores/ReportadoresManagement';
import ResponsablesManagement from './features/mantenimientos/responsables/ResponsablesManagement';
import AdministradoresManagement from './features/mantenimientos/administradores/AdministradoresManagement';
import EjesManagement from './features/mantenimientos/ejes/EjesManagement';
import ProyectosManagement from './features/mantenimientos/proyectos/ProyectosManagement';
import IncidenciasManagement from './features/mantenimientos/incidencias/IncidenciasManagement';
import { MiPerfil } from './features/perfil/MiPerfil';
import { Configuracion } from './features/configuracion/Configuracion';

function App() {
  const { initialize, isAuthenticated } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initialize();
    setIsInitialized(true);
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
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
                <IncidentDetail incidentId={0} onClose={() => {}} />
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
    </BrowserRouter>
  );
}

export default App;
