import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// Tema personalizado (debe ir después de Bootstrap para sobreescribir)
import './theme.css';

// Estilos personalizados para formularios
import './styles/form-inputs.css';

// Estilos Enterprise Dashboard (ArchitectUI / AdminLTE)
import './assets/css/dashboard-enterprise.css';

// Estilos de Clustering y Marcadores de Mapa
import './styles/mapClusters.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
