import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEjeDto, UpdateEjeDto } from './ejes.dto';

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
    const eje = await this.prisma.eje.findUnique({
      where: { id },
    });
    if (!eje) {
      throw new NotFoundException(`Eje con ID ${id} no encontrado`);
    }
    return eje;
  }

  async create(dto: CreateEjeDto) {
    return this.prisma.eje.create({
      data: {
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async update(id: number, dto: UpdateEjeDto) {
    await this.findOne(id);
    return this.prisma.eje.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.eje.delete({
      where: { id },
    });
  }
}
