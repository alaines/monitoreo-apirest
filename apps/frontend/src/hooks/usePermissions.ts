import { useAuthStore } from '../features/auth/authStore';

/**
 * Hook para centralizar la verificación de permisos según el perfil/grupo del usuario.
 * Controla especialmente la restricción de perfiles de solo consulta ('CONSULTAS', 'PUBLICO',
 * o grupos donde edicion === false en la base de datos).
 */
export function usePermissions() {
  const { user } = useAuthStore();

  // El perfil no tiene acceso a edición si edicion es false o pertenece al grupo CONSULTAS / PUBLICO
  const canEdit = Boolean(
    user &&
    user.grupo?.edicion !== false &&
    user.grupo?.nombre?.toUpperCase().trim() !== 'CONSULTAS' &&
    user.grupo?.nombre?.toUpperCase().trim() !== 'PUBLICO'
  );

  const isConsultas = Boolean(
    user?.grupo?.nombre?.toUpperCase().trim() === 'CONSULTAS' ||
    user?.grupo?.edicion === false
  );

  const isAdmin = Boolean(
    user?.grupo?.nombre?.toUpperCase().trim() === 'ADMINISTRADOR' ||
    user?.grupo?.nombre?.toUpperCase().trim() === 'SUPER_ADMIN' ||
    user?.grupoId === 4 ||
    user?.grupoId === 9
  );

  return {
    user,
    canEdit,
    isConsultas,
    isAdmin,
  };
}
