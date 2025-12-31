import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EjesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.eje.findMany({
      orderBy: {
        nombreVia: 'asc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.eje.findUnique({
      where: { id },
    });
  }
}
