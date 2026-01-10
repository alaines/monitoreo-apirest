import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const menus = await this.prisma.menu.findMany({
      select: {
        id: true,
        codigo: true,
        name: true,
        modulo: true,
        url: true,
        icono: true,
        orden: true,
        parentId: true,
        estado: true,
        created: true,
        modified: true,
      },
      orderBy: [
        { orden: 'asc' },
      ],
    });

    // Mapear campos a nombres esperados por el frontend
    return menus.map(menu => ({
      id: menu.id,
      codigo: menu.codigo || '',
      nombre: menu.name || 'Sin nombre',
      modulo: menu.modulo || '',
      ruta: menu.url || '',
      icono: menu.icono || '',
      orden: menu.orden || 0,
      menuPadreId: menu.parentId,
      activo: menu.estado ?? true,
      createdAt: menu.created,
      updatedAt: menu.modified,
    }));
  }

  async create(createMenuDto: any) {
    const menu = await this.prisma.menu.create({
      data: {
        name: createMenuDto.nombre,
        url: createMenuDto.ruta,
        icono: createMenuDto.icono,
        orden: createMenuDto.orden,
        parentId: createMenuDto.menuPadreId || null,
        estado: createMenuDto.activo ?? true,
        created: new Date(),
        modified: new Date(),
      },
    });

    return {
      id: menu.id,
      nombre: menu.name,
      ruta: menu.url,
      icono: menu.icono,
      orden: menu.orden,
      menuPadreId: menu.parentId,
      activo: menu.estado,
      createdAt: menu.created,
    };
  }

  async update(id: number, updateMenuDto: any) {
    const dataToUpdate: any = {
      modified: new Date(),
    };

    if (updateMenuDto.nombre !== undefined) dataToUpdate.name = updateMenuDto.nombre;
    if (updateMenuDto.ruta !== undefined) dataToUpdate.url = updateMenuDto.ruta;
    if (updateMenuDto.icono !== undefined) dataToUpdate.icono = updateMenuDto.icono;
    if (updateMenuDto.orden !== undefined) dataToUpdate.orden = updateMenuDto.orden;
    if (updateMenuDto.menuPadreId !== undefined) dataToUpdate.parentId = updateMenuDto.menuPadreId;
    if (updateMenuDto.activo !== undefined) dataToUpdate.estado = updateMenuDto.activo;

    const menu = await this.prisma.menu.update({
      where: { id },
      data: dataToUpdate,
    });

    return {
      id: menu.id,
      nombre: menu.name,
      ruta: menu.url,
      icono: menu.icono,
      orden: menu.orden,
      menuPadreId: menu.parentId,
      activo: menu.estado,
      updatedAt: menu.modified,
    };
  }

  async remove(id: number) {
    await this.prisma.menu.delete({
      where: { id },
    });
    return { message: 'Menú eliminado correctamente' };
  }

  async findByGrupo(grupoId: number) {
    // Obtener menús permitidos para el grupo
    const menusPermitidos = await this.prisma.grupoMenu.findMany({
      where: {
        grupoId: grupoId,
        accion: {
          codigo: 'view', // Solo necesitamos verificar permiso de "ver"
        },
      },
      select: {
        menuId: true,
      },
    });

    const menuIds = menusPermitidos.map(gm => gm.menuId);

    if (menuIds.length === 0) {
      return [];
    }

    // Obtener los menús con sus datos completos
    const menus = await this.prisma.menu.findMany({
      where: {
        id: { in: menuIds },
        estado: true,
      },
      select: {
        id: true,
        name: true,
        url: true,
        icono: true,
        orden: true,
        parentId: true,
        codigo: true,
      },
      orderBy: [
        { orden: 'asc' },
      ],
    });

    // Mapear y estructurar jerárquicamente
    const menusFormateados = menus.map(menu => ({
      id: menu.id,
      nombre: menu.name || 'Sin nombre',
      ruta: menu.url || '#',
      icono: menu.icono || '',
      orden: menu.orden || 0,
      menuPadreId: menu.parentId,
      codigo: menu.codigo || '',
    }));

    // Construir jerarquía
    return this.buildMenuHierarchy(menusFormateados);
  }

  private buildMenuHierarchy(menus: any[]): any[] {
    const menuMap = new Map<number, any>();
    const rootMenus: any[] = [];

    // Crear mapa de menús
    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, submenus: [] });
    });

    // Construir jerarquía
    menus.forEach(menu => {
      const menuNode = menuMap.get(menu.id);
      if (menu.menuPadreId === null) {
        rootMenus.push(menuNode);
      } else {
        const parent = menuMap.get(menu.menuPadreId);
        if (parent) {
          parent.submenus.push(menuNode);
        }
      }
    });

    // Ordenar recursivamente
    const sortMenus = (menuList: any[]) => {
      menuList.sort((a, b) => a.orden - b.orden);
      menuList.forEach(menu => {
        if (menu.submenus && menu.submenus.length > 0) {
          sortMenus(menu.submenus);
        }
      });
    };

    sortMenus(rootMenus);
    return rootMenus;
  }
}
