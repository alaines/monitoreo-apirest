import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaDto, UpdateAreaDto } from './areas.dto';

@Injectable()
export class AreasService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.area.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const area = await this.prisma.area.findUnique({
      where: { id },
    });
    
    if (!area) {
      throw new NotFoundException(`Área con ID ${id} no encontrada`);
    }
    
    return area;
  }

  async create(createAreaDto: CreateAreaDto) {
    return this.prisma.area.create({
      data: {
        nombre: createAreaDto.nombre,
        codigo: createAreaDto.codigo,
        estado: createAreaDto.estado ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async update(id: number, updateAreaDto: UpdateAreaDto) {
    await this.findOne(id);
    
    return this.prisma.area.update({
      where: { id },
      data: {
        ...updateAreaDto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    
    return this.prisma.area.update({
      where: { id },
      data: {
        estado: false,
        updatedAt: new Date(),
      },
    });
  }
}
