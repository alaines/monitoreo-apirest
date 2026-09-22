import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function translateErrorMessage(msg: any): string {
  if (!msg) return 'Ha ocurrido un error inesperado.';
  if (Array.isArray(msg)) {
    return msg.map((m) => translateErrorMessage(m)).filter(Boolean).join('. ');
  }
  if (typeof msg !== 'string') return String(msg);

  if (/should not be empty/i.test(msg)) {
    const prop = msg.split(' ')[0] || 'campo';
    return `El campo "${prop}" es obligatorio.`;
  }
  if (/must be a string/i.test(msg)) {
    const prop = msg.split(' ')[0] || 'campo';
    return `El campo "${prop}" debe ser un texto.`;
  }
  if (/must be an integer number/i.test(msg)) {
    const prop = msg.split(' ')[0] || 'campo';
    return `El campo "${prop}" debe ser un número entero.`;
  }
  if (/must be a number/i.test(msg)) {
    const prop = msg.split(' ')[0] || 'campo';
    return `El campo "${prop}" debe ser un número.`;
  }
  if (/must be a boolean/i.test(msg)) {
    const prop = msg.split(' ')[0] || 'campo';
    return `El campo "${prop}" debe ser verdadero o falso.`;
  }
  if (/must be an email/i.test(msg)) {
    const prop = msg.split(' ')[0] || 'campo';
    return `El campo "${prop}" debe ser un correo electrónico válido.`;
  }
  if (/Validation failed/i.test(msg)) {
    return 'Error de validación en los datos enviados.';
  }
  if (msg === 'Network Error') {
    return 'Error de conexión con el servidor. Verifique su conexión de red.';
  }
  if (msg === 'Unauthorized') {
    return 'No autorizado: Inicie sesión para continuar.';
  }
  if (msg === 'Forbidden' || msg === 'Forbidden resource') {
    return 'Acceso denegado: No tiene permisos suficientes para realizar esta acción.';
  }
  if (msg === 'Not Found') {
    return 'Recurso no encontrado.';
  }
  if (msg === 'Internal Server Error') {
    return 'Error interno del servidor. Intente más tarde.';
  }

  return msg;
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token refresh and normalize errors in Spanish
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Normalizar mensaje de error si hay respuesta del backend
    if (error.response?.data?.message) {
      error.response.data.message = translateErrorMessage(error.response.data.message);
    } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      error.message = 'Error de conexión con el servidor. Verifique su conexión de red.';
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'El tiempo de espera de la solicitud ha expirado.';
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No existe token de autenticación para renovar la sesión.');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
