import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TipoDocsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tipoDoc.findMany({
      where: { estado: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.tipoDoc.findUnique({
      where: { id },
    });
  }
}
