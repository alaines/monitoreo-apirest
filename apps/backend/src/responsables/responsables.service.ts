import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResponsableDto, UpdateResponsableDto } from './responsables.dto';

@Injectable()
export class ResponsablesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.responsable.findMany({
      include: {
        equipo: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const responsable = await this.prisma.responsable.findUnique({
      where: { id },
      include: {
        equipo: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
    
    if (!responsable) {
      throw new NotFoundException(`Responsable con ID ${id} no encontrado`);
    }
    
    return responsable;
  }

  async create(createResponsableDto: CreateResponsableDto) {
    return this.prisma.responsable.create({
      data: {
        nombre: createResponsableDto.nombre,
        equipoId: createResponsableDto.equipoId,
        estado: createResponsableDto.estado ?? true,
      },
      include: {
        equipo: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  async update(id: number, updateResponsableDto: UpdateResponsableDto) {
    await this.findOne(id);
    
    return this.prisma.responsable.update({
      where: { id },
      data: updateResponsableDto,
      include: {
        equipo: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    
    return this.prisma.responsable.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }
}
