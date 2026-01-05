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
        codigo: true,
        name: true,
        modulo: true,
        url: true,
        icono: true,
        orden: true,
      },
      orderBy: [
        { modulo: 'asc' },
        { orden: 'asc' },
      ],
    });

    // Mapear name a nombre para consistencia con el frontend
    return menus.map(menu => ({
      id: menu.id,
      codigo: menu.codigo || '',
      nombre: menu.name || 'Sin nombre',
      modulo: menu.modulo || 'Sin módulo',
      url: menu.url || '',
      icono: menu.icono || '',
      orden: menu.orden || 0,
    }));
  }
}
