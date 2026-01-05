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
            url: true,
            icono: true,
          },
        },
      },
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

    // En producción, solo verificamos si tiene acceso al menú (sin acciones)
    const permiso = await this.prisma.grupoMenu.findFirst({
      where: {
        grupoId: usuario.grupoId,
        menu: {
          name: menuCodigo, // Usamos name ya que no existe codigo
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
      },
    });

    if (existingPermiso) {
      throw new ConflictException('El permiso ya existe');
    }

    return this.prisma.grupoMenu.create({
      data: {
        grupoId: createPermisoDto.grupoId,
        menuId: createPermisoDto.menuId,
      },
      include: {
        menu: true,
      },
    });
  }

  /**
   * Crear múltiples permisos de un menú para un grupo
   */
  async bulkCreatePermisos(bulkCreatePermisosDto: BulkCreatePermisosDto) {
    const { grupoId, menuId } = bulkCreatePermisosDto;

    // Verificar que no exista
    const existingPermiso = await this.prisma.grupoMenu.findFirst({
      where: {
        grupoId,
        menuId,
      },
    });

    if (existingPermiso) {
      return this.prisma.grupoMenu.findMany({
        where: {
          grupoId,
          menuId,
        },
        include: {
          menu: true,
        },
      });
    }

    // Crear permiso
    await this.prisma.grupoMenu.create({
      data: {
        grupoId,
        menuId,
      },
    });

    return this.prisma.grupoMenu.findMany({
      where: {
        grupoId,
        menuId,
      },
      include: {
        menu: true,
      },
    });
  }

  /**
   * Eliminar permisos específicos
   */
  async bulkDeletePermisos(bulkDeletePermisosDto: BulkDeletePermisosDto) {
    const { grupoId, menuId } = bulkDeletePermisosDto;

    const result = await this.prisma.grupoMenu.deleteMany({
      where: {
        grupoId,
        menuId,
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
