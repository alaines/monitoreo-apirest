import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const menus = await this.prisma.menu.findMany({
      where: {
        estado: true,
      },
      select: {
        id: true,
        name: true,
        url: true,
        icono: true,
        parentId: true,
      },
    });

    // Mapear name a nombre para consistencia con el frontend
    return menus.map(menu => ({
      id: menu.id,
      codigo: '',
      nombre: menu.name || 'Sin nombre',
      modulo: 'Sistema',
      url: menu.url || '',
      icono: menu.icono || '',
      orden: 0,
      parentId: menu.parentId,
    }));
  }
}
