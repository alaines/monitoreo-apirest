import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProyectoDto, UpdateProyectoDto } from './proyectos.dto';

@Injectable()
export class ProyectosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.proyecto.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const proyecto = await this.prisma.proyecto.findUnique({
      where: { id },
    });
    
    if (!proyecto) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }
    
    return proyecto;
  }

  async create(createProyectoDto: CreateProyectoDto) {
    return this.prisma.proyecto.create({
      data: {
        siglas: createProyectoDto.siglas,
        nombre: createProyectoDto.nombre,
        etapa: createProyectoDto.etapa,
        ejecutado_x_empresa: createProyectoDto.ejecutado_x_empresa,
        ano_proyecto: createProyectoDto.ano_proyecto,
        red: createProyectoDto.red,
        estado: createProyectoDto.estado ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async update(id: number, updateProyectoDto: UpdateProyectoDto) {
    await this.findOne(id);
    
    return this.prisma.proyecto.update({
      where: { id },
      data: {
        ...updateProyectoDto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    
    return this.prisma.proyecto.update({
      where: { id },
      data: {
        estado: false,
        updatedAt: new Date(),
      },
    });
  }
}
