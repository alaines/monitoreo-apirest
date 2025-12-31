import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdministradoresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.administrador.findMany({
      where: {
        estado: true,
      },
      select: {
        id: true,
        nombre: true,
        responsable: true,
        telefono: true,
        email: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }
}
