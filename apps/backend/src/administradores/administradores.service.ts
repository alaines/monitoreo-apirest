import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdministradorDto, UpdateAdministradorDto } from './administradores.dto';

@Injectable()
export class AdministradoresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.administrador.findMany({
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const admin = await this.prisma.administrador.findUnique({
      where: { id },
    });
    if (!admin) {
      throw new NotFoundException(`Administrador con ID ${id} no encontrado`);
    }
    return admin;
  }

  async create(dto: CreateAdministradorDto) {
    return this.prisma.administrador.create({
      data: {
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async update(id: number, dto: UpdateAdministradorDto) {
    await this.findOne(id);
    return this.prisma.administrador.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.administrador.update({
      where: { id },
      data: {
        estado: false,
        updatedAt: new Date(),
      },
    });
  }
}
