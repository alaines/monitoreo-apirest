import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccionDto, UpdateAccionDto } from './acciones.dto';

@Injectable()
export class AccionesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.accion.findMany({
      where: { estado: true },
      orderBy: { orden: 'asc' },
    });
  }

  async findOne(id: number) {
    const accion = await this.prisma.accion.findUnique({
      where: { id },
      include: {
        _count: {
          select: { gruposMenus: true },
        },
      },
    });

    if (!accion) {
      throw new NotFoundException(`Acción con ID ${id} no encontrada`);
    }

    return accion;
  }

  async findByCodigo(codigo: string) {
    const accion = await this.prisma.accion.findUnique({
      where: { codigo },
    });

    if (!accion) {
      throw new NotFoundException(`Acción con código "${codigo}" no encontrada`);
    }

    return accion;
  }

  async create(createAccionDto: CreateAccionDto) {
    // Verificar que el código no exista
    const existingAccion = await this.prisma.accion.findUnique({
      where: { codigo: createAccionDto.codigo },
    });

    if (existingAccion) {
      throw new ConflictException(`Ya existe una acción con el código "${createAccionDto.codigo}"`);
    }

    return this.prisma.accion.create({
      data: createAccionDto,
    });
  }

  async update(id: number, updateAccionDto: UpdateAccionDto) {
    await this.findOne(id); // Verifica que existe

    return this.prisma.accion.update({
      where: { id },
      data: updateAccionDto,
    });
  }

  async remove(id: number) {
    const accion = await this.findOne(id);

    // Verificar si está siendo usada en permisos
    const permisosCount = await this.prisma.grupoMenu.count({
      where: { accionId: id },
    });

    if (permisosCount > 0) {
      throw new ConflictException(
        `No se puede eliminar la acción "${accion.nombre}" porque está siendo usada en ${permisosCount} permiso(s)`
      );
    }

    return this.prisma.accion.delete({
      where: { id },
    });
  }

  async softDelete(id: number) {
    await this.findOne(id);

    return this.prisma.accion.update({
      where: { id },
      data: { estado: false },
    });
  }
}
