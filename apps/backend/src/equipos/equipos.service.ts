import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipoDto, UpdateEquipoDto } from './equipos.dto';

@Injectable()
export class EquiposService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.equipo.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const equipo = await this.prisma.equipo.findUnique({
      where: { id },
    });
    
    if (!equipo) {
      throw new NotFoundException(`Equipo con ID ${id} no encontrado`);
    }
    
    return equipo;
  }

  async create(createEquipoDto: CreateEquipoDto) {
    return this.prisma.equipo.create({
      data: {
        nombre: createEquipoDto.nombre,
        estado: createEquipoDto.estado ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async update(id: number, updateEquipoDto: UpdateEquipoDto) {
    await this.findOne(id);
    
    return this.prisma.equipo.update({
      where: { id },
      data: {
        ...updateEquipoDto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    
    return this.prisma.equipo.update({
      where: { id },
      data: {
        estado: false,
        updatedAt: new Date(),
      },
    });
  }
}
