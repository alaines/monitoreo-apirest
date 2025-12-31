import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UbigeosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.ubigeo.findMany({
      orderBy: [
        { region: 'asc' },
        { provincia: 'asc' },
        { distrito: 'asc' },
      ],
    });
  }
}
