import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoDto, UpdateTipoDto } from './tipos.dto';

@Injectable()
export class TiposService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todos los tipos organizados jerárquicamente
   */
  async findAllHierarchical() {
    const tipos = await this.prisma.tipo.findMany({
      orderBy: [{ lft: 'asc' }],
    });

    return this.buildTree(tipos);
  }

  /**
   * Obtener todos los tipos (lista plana)
   */
  async findAll() {
    return this.prisma.tipo.findMany({
      orderBy: [{ lft: 'asc' }],
    });
  }

  /**
   * Obtener tipos padre (sin parent_id)
   */
  async findRoots() {
    return this.prisma.tipo.findMany({
      where: { parent_id: null },
      orderBy: [{ lft: 'asc' }],
    });
  }

  /**
   * Obtener un tipo por ID con sus hijos
   */
  async findOne(id: number) {
    const tipo = await this.prisma.tipo.findUnique({
      where: { id },
    });

    if (!tipo) {
      throw new NotFoundException(`Tipo con ID ${id} no encontrado`);
    }

    // Obtener hijos directos
    const children = await this.prisma.tipo.findMany({
      where: { parent_id: id },
      orderBy: [{ lft: 'asc' }],
    });

    return {
      ...tipo,
      children,
    };
  }

  /**
   * Obtener hijos de un tipo
   */
  async findChildren(parentId: number) {
    const parent = await this.prisma.tipo.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException(`Tipo padre con ID ${parentId} no encontrado`);
    }

    return this.prisma.tipo.findMany({
      where: { parent_id: parentId },
      orderBy: [{ lft: 'asc' }],
    });
  }

  /**
   * Crear un nuevo tipo
   */
  async create(createTipoDto: CreateTipoDto) {
    // Si tiene parent_id, verificar que el padre exista
    if (createTipoDto.parent_id) {
      const parent = await this.prisma.tipo.findUnique({
        where: { id: createTipoDto.parent_id },
      });

      if (!parent) {
        throw new NotFoundException(
          `Tipo padre con ID ${createTipoDto.parent_id} no encontrado`,
        );
      }
    }

    // Calcular lft y rght para nested set
    let lft = 1;
    let rght = 2;

    if (createTipoDto.parent_id) {
      const parent = await this.prisma.tipo.findUnique({
        where: { id: createTipoDto.parent_id },
      });

      if (parent && parent.rght) {
        lft = parent.rght;
        rght = parent.rght + 1;

        // Actualizar los valores de otros nodos
        await this.prisma.$executeRaw`
          UPDATE tipos SET rght = rght + 2 WHERE rght >= ${lft}
        `;
        await this.prisma.$executeRaw`
          UPDATE tipos SET lft = lft + 2 WHERE lft > ${lft}
        `;
      }
    } else {
      // Es un nodo raíz, obtener el mayor rght
      const maxRght = await this.prisma.tipo.aggregate({
        _max: { rght: true },
      });

      if (maxRght._max.rght) {
        lft = maxRght._max.rght + 1;
        rght = maxRght._max.rght + 2;
      }
    }

    return this.prisma.tipo.create({
      data: {
        ...createTipoDto,
        lft,
        rght,
      },
    });
  }

  /**
   * Actualizar un tipo
   */
  async update(id: number, updateTipoDto: UpdateTipoDto) {
    const tipo = await this.prisma.tipo.findUnique({ where: { id } });

    if (!tipo) {
      throw new NotFoundException(`Tipo con ID ${id} no encontrado`);
    }

    // Si se cambia el parent_id, verificar que no sea circular
    if (updateTipoDto.parent_id !== undefined) {
      if (updateTipoDto.parent_id === id) {
        throw new BadRequestException('Un tipo no puede ser su propio padre');
      }

      if (updateTipoDto.parent_id) {
        const parent = await this.prisma.tipo.findUnique({
          where: { id: updateTipoDto.parent_id },
        });

        if (!parent) {
          throw new NotFoundException(
            `Tipo padre con ID ${updateTipoDto.parent_id} no encontrado`,
          );
        }

        // Verificar que no sea descendiente
        const isDescendant = await this.isDescendantOf(updateTipoDto.parent_id, id);
        if (isDescendant) {
          throw new BadRequestException(
            'No se puede asignar un descendiente como padre',
          );
        }
      }
    }

    return this.prisma.tipo.update({
      where: { id },
      data: updateTipoDto,
    });
  }

  /**
   * Eliminar un tipo (soft delete)
   */
  async remove(id: number) {
    const tipo = await this.prisma.tipo.findUnique({
      where: { id },
    });

    if (!tipo) {
      throw new NotFoundException(`Tipo con ID ${id} no encontrado`);
    }

    // Verificar si tiene hijos
    const childrenCount = await this.prisma.tipo.count({
      where: { parent_id: id },
    });

    if (childrenCount > 0) {
      throw new ConflictException(
        'No se puede eliminar un tipo que tiene subtipos. Elimine primero los subtipos.',
      );
    }

    // Soft delete: marcar como inactivo
    return this.prisma.tipo.update({
      where: { id },
      data: { estado: false },
    });
  }

  /**
   * Eliminar permanentemente un tipo
   */
  async hardDelete(id: number) {
    const tipo = await this.prisma.tipo.findUnique({
      where: { id },
    });

    if (!tipo) {
      throw new NotFoundException(`Tipo con ID ${id} no encontrado`);
    }

    // Verificar si tiene hijos
    const childrenCount = await this.prisma.tipo.count({
      where: { parent_id: id },
    });

    if (childrenCount > 0) {
      throw new ConflictException(
        'No se puede eliminar un tipo que tiene subtipos',
      );
    }

    return this.prisma.tipo.delete({
      where: { id },
    });
  }

  /**
   * Construir árbol jerárquico
   */
  private buildTree(tipos: any[], parentId: number | null = null): any[] {
    return tipos
      .filter((tipo) => tipo.parent_id === parentId)
      .map((tipo) => ({
        ...tipo,
        children: this.buildTree(tipos, tipo.id),
      }));
  }

  /**
   * Verificar si un tipo es descendiente de otro
   */
  private async isDescendantOf(
    potentialDescendantId: number,
    ancestorId: number,
  ): Promise<boolean> {
    let current = await this.prisma.tipo.findUnique({
      where: { id: potentialDescendantId },
    });

    while (current && current.parent_id) {
      if (current.parent_id === ancestorId) {
        return true;
      }
      current = await this.prisma.tipo.findUnique({
        where: { id: current.parent_id },
      });
    }

    return false;
  }
}
