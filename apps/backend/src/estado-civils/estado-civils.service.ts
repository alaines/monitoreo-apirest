import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EstadoCivilsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.estadoCivil.findMany({
      where: { estado: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.estadoCivil.findUnique({
      where: { id },
    });
  }
}
