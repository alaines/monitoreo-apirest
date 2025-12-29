export enum UserRole {
  PUBLICO = 'PUBLICO',
  OPERADOR = 'OPERADOR',
  SUPERVISOR = 'SUPERVISOR',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.PUBLICO]: 'Público',
  [UserRole.OPERADOR]: 'Operador',
  [UserRole.SUPERVISOR]: 'Supervisor',
  [UserRole.ADMINISTRADOR]: 'Administrador',
};
