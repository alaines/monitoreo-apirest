import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GruposService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.grupo.findMany({
      where: {
        estado: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }
}
