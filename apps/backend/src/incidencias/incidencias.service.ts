import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidenciaDto, UpdateIncidenciaDto } from './incidencias.dto';

@Injectable()
export class IncidenciasService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.incidencia.findMany({
      include: {
        prioridad: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { tipo: 'asc' },
    });
  }

  async findOne(id: number) {
    const incidencia = await this.prisma.incidencia.findUnique({
      where: { id },
      include: {
        prioridad: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
    
    if (!incidencia) {
      throw new NotFoundException(`Incidencia con ID ${id} no encontrada`);
    }
    
    return incidencia;
  }

  async create(createIncidenciaDto: CreateIncidenciaDto) {
    return this.prisma.incidencia.create({
      data: {
        tipo: createIncidenciaDto.tipo,
        parentId: createIncidenciaDto.parentId,
        prioridadId: createIncidenciaDto.prioridadId,
        caracteristica: createIncidenciaDto.caracteristica,
        estado: createIncidenciaDto.estado ?? true,
      },
      include: {
        prioridad: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  async update(id: number, updateIncidenciaDto: UpdateIncidenciaDto) {
    await this.findOne(id);
    
    return this.prisma.incidencia.update({
      where: { id },
      data: updateIncidenciaDto,
      include: {
        prioridad: {
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
    
    return this.prisma.incidencia.update({
      where: { id },
      data: {
        estado: false,
      },
    });
  }
}
