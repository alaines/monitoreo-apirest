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
}
