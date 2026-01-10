import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  /**
   * Recalcula los valores lft y rght para todo el árbol
   * Implementa Nested Set Model (Modified Preorder Tree Traversal)
   */
  async rebuildTree(): Promise<void> {
    const menus = await this.prisma.menu.findMany({
      orderBy: { orden: 'asc' },
    });

    let counter = 1;
    const updates: any[] = [];

    const traverse = (parentId: number | null): number => {
      const children = menus
        .filter(m => m.parentId === parentId)
        .sort((a, b) => (a.orden || 0) - (b.orden || 0));
      
      children.forEach(menu => {
        const left = counter++;
        const right = traverse(menu.id);
        
        updates.push({
          where: { id: menu.id },
          data: { lft: left, rght: right }
        });
      });

      return counter++;
    };

    traverse(null);
    
    // Ejecutar todas las actualizaciones
    for (const update of updates) {
      await this.prisma.menu.update(update);
    }
  }

  /**
   * Obtiene todo el árbol de menús ordenado por lft
   */
  async getTree() {
    await this.rebuildTree();
    
    const menus = await this.prisma.menu.findMany({
      orderBy: [{ lft: 'asc' }],
    });

    return menus.map(menu => ({
      id: menu.id,
      nombre: menu.name || 'Sin nombre',
      codigo: menu.codigo || '',
      ruta: menu.url || '#',
      icono: menu.icono || '',
      orden: menu.orden || 0,
      menuPadreId: menu.parentId,
      activo: menu.estado ?? true,
      lft: menu.lft,
      rght: menu.rght,
      nivel: this.calculateLevel(menu.lft, menu.rght),
    }));
  }

  /**
   * Calcula el nivel de profundidad basándose en lft y rght
   */
  private calculateLevel(lft: number | null, rght: number | null): number {
    if (!lft || !rght) return 0;
    return Math.floor((rght - lft - 1) / 2);
  }

  /**
   * Obtiene todos los menús con formato para el frontend
   */
  async findAll() {
    const menus = await this.prisma.menu.findMany({
      orderBy: [{ orden: 'asc' }],
    });

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

  /**
   * Crea un nuevo menú
   */
  async create(createMenuDto: any) {
    // Obtener el siguiente orden dentro del padre
    const siblings = await this.prisma.menu.findMany({
      where: { parentId: createMenuDto.menuPadreId || null },
    });
    
    const nextOrden = siblings.length > 0 
      ? Math.max(...siblings.map(s => s.orden || 0)) + 1 
      : 1;

    const menu = await this.prisma.menu.create({
      data: {
        name: createMenuDto.nombre,
        url: createMenuDto.ruta || '#',
        icono: createMenuDto.icono || '',
        codigo: createMenuDto.codigo,
        modulo: createMenuDto.modulo,
        orden: createMenuDto.orden ?? nextOrden,
        parentId: createMenuDto.menuPadreId || null,
        estado: createMenuDto.activo ?? true,
        created: new Date(),
        modified: new Date(),
      },
    });

    await this.rebuildTree();

    return {
      id: menu.id,
      nombre: menu.name,
      codigo: menu.codigo,
      ruta: menu.url,
      icono: menu.icono,
      orden: menu.orden,
      menuPadreId: menu.parentId,
      activo: menu.estado,
    };
  }

  /**
   * Actualiza un menú existente
   */
  async update(id: number, updateMenuDto: any) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new NotFoundException(`Menú con ID ${id} no encontrado`);
    }

    const updated = await this.prisma.menu.update({
      where: { id },
      data: {
        name: updateMenuDto.nombre ?? menu.name,
        url: updateMenuDto.ruta ?? menu.url,
        icono: updateMenuDto.icono ?? menu.icono,
        codigo: updateMenuDto.codigo ?? menu.codigo,
        modulo: updateMenuDto.modulo ?? menu.modulo,
        orden: updateMenuDto.orden ?? menu.orden,
        parentId: updateMenuDto.menuPadreId !== undefined ? updateMenuDto.menuPadreId : menu.parentId,
        estado: updateMenuDto.activo ?? menu.estado,
        modified: new Date(),
      },
    });

    await this.rebuildTree();

    return {
      id: updated.id,
      nombre: updated.name,
      codigo: updated.codigo,
      ruta: updated.url,
      icono: updated.icono,
      orden: updated.orden,
      menuPadreId: updated.parentId,
      activo: updated.estado,
    };
  }

  /**
   * Elimina un menú (y sus hijos si existen)
   */
  async remove(id: number) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new NotFoundException(`Menú con ID ${id} no encontrado`);
    }

    // Verificar si tiene hijos
    const children = await this.prisma.menu.findMany({
      where: { parentId: id },
    });

    if (children.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar el menú porque tiene ${children.length} submenú(s)`
      );
    }

    await this.prisma.menu.delete({ where: { id } });
    await this.rebuildTree();

    return { message: 'Menú eliminado exitosamente' };
  }

  /**
   * Mueve un menú hacia arriba (decrementa orden)
   */
  async moveUp(id: number) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new NotFoundException(`Menú con ID ${id} no encontrado`);
    }

    const currentOrden = menu.orden || 0;

    // Buscar el hermano anterior con el mismo padre
    const previousSibling = await this.prisma.menu.findFirst({
      where: {
        parentId: menu.parentId,
        orden: { lt: currentOrden },
      },
      orderBy: { orden: 'desc' },
    });

    if (!previousSibling) {
      throw new BadRequestException('El menú ya está en la primera posición');
    }

    // Intercambiar órdenes
    const tempOrden = currentOrden;
    await this.prisma.menu.update({
      where: { id: menu.id },
      data: { orden: previousSibling.orden },
    });
    await this.prisma.menu.update({
      where: { id: previousSibling.id },
      data: { orden: tempOrden },
    });

    await this.rebuildTree();

    return { message: 'Menú movido hacia arriba' };
  }

  /**
   * Mueve un menú hacia abajo (incrementa orden)
   */
  async moveDown(id: number) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new NotFoundException(`Menú con ID ${id} no encontrado`);
    }

    const currentOrden = menu.orden || 0;

    // Buscar el hermano siguiente con el mismo padre
    const nextSibling = await this.prisma.menu.findFirst({
      where: {
        parentId: menu.parentId,
        orden: { gt: currentOrden },
      },
      orderBy: { orden: 'asc' },
    });

    if (!nextSibling) {
      throw new BadRequestException('El menú ya está en la última posición');
    }

    // Intercambiar órdenes
    const tempOrden = currentOrden;
    await this.prisma.menu.update({
      where: { id: menu.id },
      data: { orden: nextSibling.orden },
    });
    await this.prisma.menu.update({
      where: { id: nextSibling.id },
      data: { orden: tempOrden },
    });

    await this.rebuildTree();

    return { message: 'Menú movido hacia abajo' };
  }

  /**
   * Cambia el padre de un menú
   */
  async changeParent(id: number, newParentId: number | null) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new NotFoundException(`Menú con ID ${id} no encontrado`);
    }

    // Verificar que no se esté intentando mover a sí mismo
    if (newParentId === id) {
      throw new BadRequestException('Un menú no puede ser padre de sí mismo');
    }

    if (newParentId) {
      const newParent = await this.prisma.menu.findUnique({ 
        where: { id: newParentId} 
      });
      if (!newParent) {
        throw new NotFoundException(`Menú padre con ID ${newParentId} no encontrado`);
      }

      // Verificar que el nuevo padre no sea un descendiente del menú actual
      const descendants = await this.getDescendants(id);
      if (descendants.some(d => d.id === newParentId)) {
        throw new BadRequestException('No se puede mover a un menú descendiente');
      }
    }

    // Obtener el siguiente orden en el nuevo padre
    const siblings = await this.prisma.menu.findMany({
      where: { parentId: newParentId },
    });
    const nextOrden = siblings.length > 0 
      ? Math.max(...siblings.map(s => s.orden || 0)) + 1 
      : 1;

    await this.prisma.menu.update({
      where: { id },
      data: { 
        parentId: newParentId,
        orden: nextOrden,
        modified: new Date(),
      },
    });

    await this.rebuildTree();

    return { message: 'Menú movido exitosamente' };
  }

  /**
   * Obtiene todos los descendientes de un menú
   */
  private async getDescendants(menuId: number): Promise<any[]> {
    const menu = await this.prisma.menu.findUnique({ where: { id: menuId } });
    if (!menu || !menu.lft || !menu.rght) return [];

    return await this.prisma.menu.findMany({
      where: {
        lft: { gt: menu.lft },
        rght: { lt: menu.rght },
      },
    });
  }

  /**
   * Obtiene menús filtrados por grupo (para el sidebar dinámico)
   */
  async findByGrupo(grupoId: number) {
    const menus = await this.prisma.menu.findMany({
      where: {
        estado: true,
        gruposMenus: {
          some: {
            grupoId: grupoId,
            accion: {
              codigo: 'view',
            },
          },
        },
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

    const menusFormateados = menus.map(menu => ({
      id: menu.id,
      nombre: menu.name || 'Sin nombre',
      ruta: menu.url || '#',
      icono: menu.icono || '',
      orden: menu.orden || 0,
      menuPadreId: menu.parentId,
      codigo: menu.codigo || '',
    }));

    return this.buildMenuHierarchy(menusFormateados);
  }

  private buildMenuHierarchy(menus: any[]): any[] {
    const menuMap = new Map<number, any>();
    const rootMenus: any[] = [];

    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, submenus: [] });
    });

    menus.forEach(menu => {
      const menuNode = menuMap.get(menu.id);
      if (menu.menuPadreId && menuMap.has(menu.menuPadreId)) {
        const parent = menuMap.get(menu.menuPadreId);
        parent.submenus.push(menuNode);
      } else {
        rootMenus.push(menuNode);
      }
    });

    return rootMenus;
  }
}
