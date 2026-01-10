import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrupoDto, UpdateGrupoDto } from './dto/grupo.dto';

@Injectable()
export class GruposService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.grupo.findMany({
      where: {
        estado: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const grupo = await this.prisma.grupo.findUnique({
      where: { id },
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo con ID ${id} no encontrado`);
    }

    return grupo;
  }

  async create(createGrupoDto: CreateGrupoDto) {
    // Verificar que no exista otro grupo con el mismo nombre
    const existente = await this.prisma.grupo.findFirst({
      where: {
        nombre: createGrupoDto.nombre,
        estado: true,
      },
    });

    if (existente) {
      throw new ConflictException(`Ya existe un grupo con el nombre "${createGrupoDto.nombre}"`);
    }

    return this.prisma.grupo.create({
      data: {
        ...createGrupoDto,
        estado: createGrupoDto.estado ?? true,
      },
    });
  }

  async update(id: number, updateGrupoDto: UpdateGrupoDto) {
    await this.findOne(id);

    // Verificar que no exista otro grupo con el mismo nombre
    if (updateGrupoDto.nombre) {
      const existente = await this.prisma.grupo.findFirst({
        where: {
          nombre: updateGrupoDto.nombre,
          estado: true,
          id: { not: id },
        },
      });

      if (existente) {
        throw new ConflictException(`Ya existe un grupo con el nombre "${updateGrupoDto.nombre}"`);
      }
    }

    return this.prisma.grupo.update({
      where: { id },
      data: updateGrupoDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Soft delete - cambiar estado a false
    return this.prisma.grupo.update({
      where: { id },
      data: { estado: false },
    });
  }
}
