import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePermisoDto,
  BulkCreatePermisosDto,
  BulkDeletePermisosDto,
} from './permisos.dto';

@Injectable()
export class PermisosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todos los permisos de un grupo
   */
  async getPermisosByGrupo(grupoId: number) {
    const grupo = await this.prisma.grupo.findUnique({
      where: { id: grupoId },
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo con ID ${grupoId} no encontrado`);
    }

    return this.prisma.grupoMenu.findMany({
      where: { grupoId },
      include: {
        menu: {
          select: {
            id: true,
            name: true,
            codigo: true,
            modulo: true,
            url: true,
            icono: true,
          },
        },
        accion: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
      orderBy: [
        { menu: { modulo: 'asc' } },
        { menu: { orden: 'asc' } },
        { accion: { orden: 'asc' } },
      ],
    });
  }

  /**
   * Obtener permisos de un usuario (a través de su grupo)
   */
  async getPermisosByUsuario(usuarioId: number) {
    const usuario = await this.prisma.user.findUnique({
      where: { id: usuarioId },
      include: {
        grupo: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
    }

    if (!usuario.grupoId) {
      return [];
    }

    return this.getPermisosByGrupo(usuario.grupoId);
  }

  /**
   * Verificar si un usuario tiene un permiso específico
   */
  async verificarPermiso(
    usuarioId: number,
    menuCodigo: string,
    accionCodigo: string,
  ): Promise<boolean> {
    const usuario = await this.prisma.user.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario || !usuario.grupoId) {
      return false;
    }

    // Verificar si el menú existe
    const menu = await this.prisma.menu.findUnique({
      where: { codigo: menuCodigo },
    });

    // Si el menú no existe, permitir acceso (endpoints sin control de permisos)
    if (!menu) {
      console.log(`[PermisosService] Menú '${menuCodigo}' no existe, permitiendo acceso`);
      return true;
    }

    const permiso = await this.prisma.grupoMenu.findFirst({
      where: {
        grupoId: usuario.grupoId,
        menu: {
          codigo: menuCodigo,
        },
        accion: {
          codigo: accionCodigo,
        },
      },
    });

    return !!permiso;
  }

  /**
   * Crear un permiso individual
   */
  async createPermiso(createPermisoDto: CreatePermisoDto) {
    // Verificar que no exista
    const existingPermiso = await this.prisma.grupoMenu.findFirst({
      where: {
        grupoId: createPermisoDto.grupoId,
        menuId: createPermisoDto.menuId,
        accionId: createPermisoDto.accionId,
      },
    });

    if (existingPermiso) {
      throw new ConflictException('El permiso ya existe');
    }

    return this.prisma.grupoMenu.create({
      data: createPermisoDto,
      include: {
        menu: true,
        accion: true,
      },
    });
  }

  /**
   * Crear múltiples permisos de un menú para un grupo
   */
  async bulkCreatePermisos(bulkCreatePermisosDto: BulkCreatePermisosDto) {
    const { grupoId, menuId, accionesIds } = bulkCreatePermisosDto;

    // Eliminar permisos existentes de este grupo+menú
    await this.prisma.grupoMenu.deleteMany({
      where: {
        grupoId,
        menuId,
      },
    });

    // Crear nuevos permisos
    const permisosData = accionesIds.map((accionId) => ({
      grupoId,
      menuId,
      accionId,
    }));

    await this.prisma.grupoMenu.createMany({
      data: permisosData,
      skipDuplicates: true,
    });

    return this.prisma.grupoMenu.findMany({
      where: {
        grupoId,
        menuId,
      },
      include: {
        accion: true,
      },
    });
  }

  /**
   * Guardar permisos completos de un grupo (reemplaza todos los permisos existentes)
   */
  async bulkSavePermisos(bulkSavePermisosDto: any) {
    const { grupoId, permisos } = bulkSavePermisosDto;

    // Eliminar todos los permisos existentes del grupo
    await this.prisma.grupoMenu.deleteMany({
      where: { grupoId },
    });

    // Si hay permisos nuevos, crearlos
    if (permisos && permisos.length > 0) {
      const permisosData = permisos.map((p: any) => ({
        grupoId,
        menuId: p.menuId,
        accionId: p.accionId,
      }));

      await this.prisma.grupoMenu.createMany({
        data: permisosData,
      });
    }

    return {
      created: permisos?.length || 0,
      message: `Se guardaron ${permisos?.length || 0} permiso(s)`,
    };
  }

  /**
   * Eliminar permisos específicos
   */
  async bulkDeletePermisos(bulkDeletePermisosDto: BulkDeletePermisosDto) {
    const { grupoId, menuId, accionesIds } = bulkDeletePermisosDto;

    const result = await this.prisma.grupoMenu.deleteMany({
      where: {
        grupoId,
        menuId,
        accionId: {
          in: accionesIds,
        },
      },
    });

    return {
      deleted: result.count,
      message: `Se eliminaron ${result.count} permiso(s)`,
    };
  }

  /**
   * Eliminar un permiso específico
   */
  async deletePermiso(id: number) {
    const permiso = await this.prisma.grupoMenu.findUnique({
      where: { id },
    });

    if (!permiso) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado`);
    }

    await this.prisma.grupoMenu.delete({
      where: { id },
    });

    return { message: 'Permiso eliminado exitosamente' };
  }

  /**
   * Copiar permisos de un grupo a otro
   */
  async copiarPermisos(grupoOrigenId: number, grupoDestinoId: number) {
    const permisosOrigen = await this.prisma.grupoMenu.findMany({
      where: { grupoId: grupoOrigenId },
    });

    if (permisosOrigen.length === 0) {
      throw new NotFoundException(
        `El grupo origen ${grupoOrigenId} no tiene permisos`,
      );
    }

    // Eliminar permisos actuales del grupo destino
    await this.prisma.grupoMenu.deleteMany({
      where: { grupoId: grupoDestinoId },
    });

    // Copiar permisos
    const permisosDestino = permisosOrigen.map((permiso) => ({
      grupoId: grupoDestinoId,
      menuId: permiso.menuId,
      accionId: permiso.accionId,
    }));

    await this.prisma.grupoMenu.createMany({
      data: permisosDestino,
      skipDuplicates: true,
    });

    return {
      copiados: permisosDestino.length,
      message: `Se copiaron ${permisosDestino.length} permiso(s) exitosamente`,
    };
  }
}
