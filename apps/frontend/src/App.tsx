import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingActionsIcon,
} from '@mui/icons-material';
import { useAuthStore } from './features/auth/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './features/auth/pages/LoginPage';
import { Layout } from './components/Layout';
import { IncidentsList } from './features/incidents/IncidentsList';
import { IncidentForm } from './features/incidents/IncidentForm';
import { IncidentDetail } from './features/incidents/IncidentDetail';
import { incidentsService } from './services/incidents.service';

function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pendiente: 0,
    enProceso: 0,
    completado: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await incidentsService.getStatistics();
      const byEstado = data.byEstado || [];
      
      setStats({
        total: data.total || 0,
        pendiente: byEstado.find((e) => e.estadoId === 1)?.count || 0,
        enProceso: byEstado.find((e) => e.estadoId === 2)?.count || 0,
        completado: byEstado.find((e) => e.estadoId === 3)?.count || 0,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Incidencias',
      value: stats.total.toString(),
      icon: <TrendingUpIcon />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Pendientes',
      value: stats.pendiente.toString(),
      icon: <PendingActionsIcon />,
      color: '#ed6c02',
      bgColor: '#fff4e5',
    },
    {
      title: 'En Proceso',
      value: stats.enProceso.toString(),
      icon: <WarningIcon />,
      color: '#f57c00',
      bgColor: '#fff3e0',
    },
    {
      title: 'Resueltas',
      value: stats.completado.toString(),
      icon: <CheckCircleIcon />,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
  ];

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Bienvenido, <strong>{user?.usuario}</strong> - {user?.grupo?.nombre}
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {statsCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: stat.bgColor,
                        color: stat.color,
                        width: 56,
                        height: 56,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                  </Box>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={8}>
            <Card elevation={2}>
              <CardHeader title="Incidencias Recientes" />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  No hay incidencias registradas aún.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardHeader title="Actividad Reciente" />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Sin actividad reciente.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}

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
          elem
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
                <IncidentForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <IncidentForm />
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
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
