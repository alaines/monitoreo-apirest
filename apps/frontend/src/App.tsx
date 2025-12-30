import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './features/auth/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './features/auth/pages/LoginPage';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { IncidentsList } from './features/incidents/IncidentsList';
import { IncidentForm } from './features/incidents/IncidentForm';
import { IncidentDetail } from './features/incidents/IncidentDetail';

function App() {
  const { initialize, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

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
                <Dashboard />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
