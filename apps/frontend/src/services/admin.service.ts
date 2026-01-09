import { api } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.18.230:3001/api';

// ============= TIPOS (CATÁLOGOS) =============

export interface Tipo {
  id: number;
  name: string;
  parent_id: number | null;
  estado: boolean;
  lft: number | null;
  rght: number | null;
  children?: Tipo[];
}

export interface CreateTipoDto {
  name: string;
  parent_id?: number;
  estado?: boolean;
}

export interface UpdateTipoDto {
  name?: string;
  parent_id?: number;
  estado?: boolean;
}

export const tiposService = {
  async getAll() {
    const { data } = await api.get(`/tipos`);
    return data;
  },

  async getHierarchical() {
    const { data } = await api.get(`/tipos/hierarchical`);
    return data;
  },

  async getRoots() {
    const { data } = await api.get(`/tipos/roots`);
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get(`/tipos/${id}`);
    return data;
  },

  async getChildren(parentId: number) {
    const { data } = await api.get(`/tipos/${parentId}/children`);
    return data;
  },

  async create(tipoData: CreateTipoDto) {
    const { data } = await api.post(`/tipos`, tipoData);
    return data;
  },

  async update(id: number, tipoData: UpdateTipoDto) {
    const { data } = await api.patch(`/tipos/${id}`, tipoData);
    return data;
  },

  async delete(id: number) {
    const { data } = await api.delete(`/tipos/${id}`);
    return data;
  },

  async hardDelete(id: number) {
    const { data } = await api.delete(`/tipos/${id}/hard`);
    return data;
  }
};

// ============= USUARIOS =============

export interface User {
  id: number;
  usuario: string;
  grupoId: number;
  areaId?: number;
  personaId?: number;
  estado: boolean;
  created: string;
  modified: string;
  grupo?: {
    id: number;
    nombre: string;
    descripcion: string;
  };
  area?: {
    id: number;
    nombre: string;
  };
  persona?: {
    id: number;
    tipoDocId?: number;
    numDoc?: string;
    nombres?: string;
    apePat?: string;
    apeMat?: string;
    nomcomp?: string;
    genero?: string;
    fecnac?: string;
    estadoCivilId?: number;
    email?: string;
    movil1?: string;
  };
  // Campos calculados para compatibilidad
  nombreCompleto?: string;
  email?: string | null;
  telefono?: string | null;
}

export interface CreateUserDto {
  // Campos de usuario
  usuario: string;
  password: string;
  grupoId: number;
  areaId?: number;
  estado?: boolean;
  // Campos de persona
  tipoDocId: number;
  nroDoc: string;
  nombres: string;
  apellidoP: string;
  apellidoM: string;
  fechaNacimiento?: string;
  genero?: string;
  estadoCivilId?: number;
  email?: string;
  telefono?: string;
}

export interface UpdateUserDto {
  // Campos de usuario
  usuario?: string;
  password?: string;
  grupoId?: number;
  areaId?: number;
  estado?: boolean;
  // Campos de persona
  tipoDocId?: number;
  nroDoc?: string;
  nombres?: string;
  apellidoP?: string;
  apellidoM?: string;
  fechaNacimiento?: string;
  genero?: string;
  estadoCivilId?: number;
  email?: string;
  telefono?: string;
}

export const usersService = {
  async getAll(page = 1, limit = 10) {
    const { data } = await api.get(`/users`, {
      params: { page, limit }
    });
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  async create(userData: CreateUserDto) {
    const { data } = await api.post(`/users`, userData);
    return data;
  },

  async update(id: number, userData: UpdateUserDto) {
    const { data } = await api.patch(`/users/${id}`, userData);
    return data;
  },

  async delete(id: number) {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  }
};

// ============= GRUPOS =============

export interface Grupo {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  created: string;
  modified: string;
}

export interface CreateGrupoDto {
  nombre: string;
  descripcion: string;
  estado?: boolean;
}

export const gruposService = {
  async getAll() {
    const { data } = await api.get(`/grupos`);
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get(`/grupos/${id}`);
    return data;
  },

  async create(grupoData: CreateGrupoDto) {
    const { data } = await api.post(`/grupos`, grupoData);
    return data;
  },

  async update(id: number, grupoData: Partial<CreateGrupoDto>) {
    const { data } = await api.patch(`/grupos/${id}`, grupoData);
    return data;
  },

  async delete(id: number) {
    const { data } = await api.delete(`/grupos/${id}`);
    return data;
  }
};

// ============= PERMISOS =============

export interface Accion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string | null;
  estado: boolean;
}

export interface Menu {
  id: number;
  codigo: string;
  nombre: string;
  modulo: string;
  url?: string;
  icono?: string;
  orden?: number;
}

export interface Permiso {
  grupoId: number;
  menuId: number;
  accionId: number;
  menu?: Menu;
  accion?: Accion;
}

export interface BulkPermisosDto {
  grupoId: number;
  permisos: Array<{
    menuId: number;
    accionId: number;
  }>;
}

export const permisosService = {
  async getByGrupo(grupoId: number) {
    const { data } = await api.get(`/permisos/grupo/${grupoId}`);
    return data;
  },

  async getByUsuario(usuarioId: number) {
    const { data } = await api.get(`/permisos/usuario/${usuarioId}`);
    return data;
  },

  async verificarPermiso(usuarioId: number, menuCodigo: string, accionCodigo: string) {
    const { data } = await api.get(`/permisos/verificar`, {
      params: { usuarioId, menuCodigo, accionCodigo }
    });
    return data.hasPermission;
  },

  async createPermiso(permiso: { grupoId: number; menuId: number; accionId: number }) {
    const { data } = await api.post(`/permisos`, permiso);
    return data;
  },

  async bulkCreate(dto: BulkPermisosDto) {
    const { data } = await api.post(`/permisos/bulk`, dto);
    return data;
  },

  async bulkDelete(grupoId: number, menuIds: number[], accionIds: number[]) {
    const { data } = await api.delete(`/permisos/bulk`, {
      data: { grupoId, menuIds, accionIds }
    });
    return data;
  },

  async copiarPermisos(grupoOrigenId: number, grupoDestinoId: number) {
    const { data } = await api.post(`/permisos/copiar`, {
      grupoOrigenId,
      grupoDestinoId
    });
    return data;
  }
};

// ============= ACCIONES =============

export const accionesService = {
  async getAll() {
    const { data } = await api.get(`/acciones`);
    return data;
  },

  async getById(id: number) {
    const { data } = await api.get(`/acciones/${id}`);
    return data;
  },

  async getByCodigo(codigo: string) {
    const { data } = await api.get(`/acciones/codigo/${codigo}`);
    return data;
  }
};

// ============= MENUS =============

export const menusService = {
  async getAll() {
    const { data } = await api.get(`/menus`);
    return data;
  }
};

// ============= MANTENIMIENTOS =============

// ÁREAS
export interface Area {
  id: number;
  nombre: string | null;
  codigo: string | null;
  estado: boolean | null;
}

export const areasService = {
  async getAll() {
    const { data } = await api.get(`/areas`);
    return data;
  },
  async getById(id: number) {
    const { data } = await api.get(`/areas/${id}`);
    return data;
  },
  async create(area: { nombre: string; codigo?: string; estado?: boolean }) {
    const { data } = await api.post(`/areas`, area);
    return data;
  },
  async update(id: number, area: { nombre?: string; codigo?: string; estado?: boolean }) {
    const { data } = await api.patch(`/areas/${id}`, area);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete(`/areas/${id}`);
    return data;
  }
};

// EQUIPOS
export interface Equipo {
  id: number;
  nombre: string | null;
  estado: boolean | null;
}

export const equiposService = {
  async getAll() {
    const { data } = await api.get(`/equipos`);
    return data;
  },
  async getById(id: number) {
    const { data } = await api.get(`/equipos/${id}`);
    return data;
  },
  async create(equipo: { nombre: string; estado?: boolean }) {
    const { data } = await api.post(`/equipos`, equipo);
    return data;
  },
  async update(id: number, equipo: { nombre?: string; estado?: boolean }) {
    const { data } = await api.patch(`/equipos/${id}`, equipo);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete(`/equipos/${id}`);
    return data;
  }
};

// REPORTADORES
export interface Reportador {
  id: number;
  nombre: string;
  estado: boolean | null;
}

export const reportadoresService = {
  async getAll() {
    const { data } = await api.get(`/reportadores`);
    return data;
  },
  async getById(id: number) {
    const { data } = await api.get(`/reportadores/${id}`);
    return data;
  },
  async create(reportador: { nombre: string; estado?: boolean }) {
    const { data } = await api.post(`/reportadores`, reportador);
    return data;
  },
  async update(id: number, reportador: { nombre?: string; estado?: boolean }) {
    const { data } = await api.patch(`/reportadores/${id}`, reportador);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete(`/reportadores/${id}`);
    return data;
  }
};

// RESPONSABLES
export interface Responsable {
  id: number;
  nombre: string | null;
  equipoId: number | null;
  estado: boolean;
  equipo?: { id: number; nombre: string | null };
}

export const responsablesService = {
  async getAll() {
    const { data } = await api.get(`/responsables`);
    return data;
  },
  async getById(id: number) {
    const { data } = await api.get(`/responsables/${id}`);
    return data;
  },
  async create(responsable: { nombre: string; equipoId?: number; estado?: boolean }) {
    const { data } = await api.post(`/responsables`, responsable);
    return data;
  },
  async update(id: number, responsable: { nombre?: string; equipoId?: number; estado?: boolean }) {
    const { data } = await api.patch(`/responsables/${id}`, responsable);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete(`/responsables/${id}`);
    return data;
  }
};

// ADMINISTRADORES
export interface Administrador {
  id: number;
  nombre: string;
  responsable: string | null;
  telefono: number | null;
  email: string | null;
  estado: boolean | null;
}

export const administradoresService = {
  async getAll() {
    const { data } = await api.get(`/administradores`);
    return data;
  },
  async getById(id: number) {
    const { data } = await api.get(`/administradores/${id}`);
    return data;
  },
  async create(admin: { nombre: string; responsable?: string; telefono?: number; email?: string; estado?: boolean }) {
    const { data } = await api.post(`/administradores`, admin);
    return data;
  },
  async update(id: number, admin: { nombre?: string; responsable?: string; telefono?: number; email?: string; estado?: boolean }) {
    const { data } = await api.patch(`/administradores/${id}`, admin);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete(`/administradores/${id}`);
    return data;
  }
};

// EJES
export interface Eje {
  id: number;
  nombreVia: string;
  tipoVia: number | null;
  nroCarriles: number | null;
  ciclovia: boolean | null;
  observaciones: string | null;
}

export const ejesService = {
  async getAll() {
    const { data } = await api.get(`/ejes`);
    return data;
  },
  async getById(id: number) {
    const { data } = await api.get(`/ejes/${id}`);
    return data;
  },
  async create(eje: { nombreVia: string; tipoVia?: number; nroCarriles?: number; ciclovia?: boolean; observaciones?: string }) {
    const { data } = await api.post(`/ejes`, eje);
    return data;
  },
  async update(id: number, eje: { nombreVia?: string; tipoVia?: number; nroCarriles?: number; ciclovia?: boolean; observaciones?: string }) {
    const { data } = await api.patch(`/ejes/${id}`, eje);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete(`/ejes/${id}`);
    return data;
  }
};

// PROYECTOS
export interface Proyecto {
  id: number;
  siglas: string | null;
  nombre: string | null;
  etapa: string | null;
  ejecutado_x_empresa: string | null;
  ano_proyecto: number | null;
  red: string | null;
  estado: boolean;
}

export const proyectosService = {
  async getAll() {
    const { data } = await api.get(`/proyectos`);
    return data;
  },
  async getById(id: number) {
    const { data } = await api.get(`/proyectos/${id}`);
    return data;
  },
  async create(proyecto: { siglas?: string; nombre?: string; etapa?: string; ejecutado_x_empresa?: string; ano_proyecto?: number; red?: string; estado?: boolean }) {
    const { data } = await api.post(`/proyectos`, proyecto);
    return data;
  },
  async update(id: number, proyecto: { siglas?: string; nombre?: string; etapa?: string; ejecutado_x_empresa?: string; ano_proyecto?: number; red?: string; estado?: boolean }) {
    const { data } = await api.patch(`/proyectos/${id}`, proyecto);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete(`/proyectos/${id}`);
    return data;
  }
};

// CATÁLOGOS PERSONAS
export interface TipoDoc {
  id: number;
  nombre: string;
  estado: boolean;
}

export interface EstadoCivil {
  id: number;
  nombre: string;
  estado: boolean;
}

export const catalogosPersonasService = {
  async getTiposDocumento() {
    const { data } = await api.get(`/tipo-docs`);
    return data;
  },
  
  async getEstadosCiviles() {
    const { data } = await api.get(`/estado-civils`);
    return data;
  }
};

// INCIDENCIAS
export interface TipoIncidencia {
  id: number;
  tipo: string | null;
  parentId: number | null;
  prioridadId: number | null;
  caracteristica: string | null;
  estado: boolean;
}

export const incidenciasService = {
  async getAll() {
    const { data } = await api.get(`/incidencias`);
    return data;
  },
  async getById(id: number) {
    const { data } = await api.get(`/incidencias/${id}`);
    return data;
  },
  async create(incidencia: { tipo: string; parentId?: number; prioridadId?: number; caracteristica?: string; estado?: boolean }) {
    const { data } = await api.post(`/incidencias`, incidencia);
    return data;
  },
  async update(id: number, incidencia: { tipo?: string; parentId?: number; prioridadId?: number; caracteristica?: string; estado?: boolean }) {
    const { data } = await api.patch(`/incidencias/${id}`, incidencia);
    return data;
  },
  async delete(id: number) {
    const { data } = await api.delete(`/incidencias/${id}`);
    return data;
  }
};

// ============= MENÚS =============

export const adminService = {
  async getMenus() {
    const { data } = await api.get(`/menus`);
    return data;
  },
  async createMenu(menu: { nombre: string; icono: string; ruta: string; orden: number; menuPadreId?: number | null; activo: boolean }) {
    const { data } = await api.post(`/menus`, menu);
    return data;
  },
  async updateMenu(id: number, menu: { nombre?: string; icono?: string; ruta?: string; orden?: number; menuPadreId?: number | null; activo?: boolean }) {
    const { data } = await api.patch(`/menus/${id}`, menu);
    return data;
  },
  async deleteMenu(id: number) {
    const { data } = await api.delete(`/menus/${id}`);
    return data;
  }
};
