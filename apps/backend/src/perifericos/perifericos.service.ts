import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePerifericoDto } from './dto/create-periferico.dto';
import { UpdatePerifericoDto } from './dto/update-periferico.dto';
import { QueryPerifericosDto } from './dto/query-perifericos.dto';

@Injectable()
export class PerifericosService {
  constructor(private prisma: PrismaService) {}

  async create(createPerifericoDto: CreatePerifericoDto) {
    return this.prisma.periferico.create({
      data: {
        ...createPerifericoDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findAll(query: QueryPerifericosDto) {
    const { page = 1, limit = 10, search, tipoPeriferico, estado, sortBy = 'id', sortOrder = 'desc' } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        {
          fabricante: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          modelo: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          numeroSerie: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (tipoPeriferico !== undefined) {
      where.tipoPeriferico = tipoPeriferico;
    }

    if (estado) {
      where.estado = {
        contains: estado,
        mode: 'insensitive',
      };
    }

    const [total, data] = await Promise.all([
      this.prisma.periferico.count({ where }),
      this.prisma.periferico.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          crucesPerifericos: {
            include: {
              cruce: {
                select: {
                  id: true,
                  nombre: true,
                  codigo: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const periferico = await this.prisma.periferico.findUnique({
      where: { id },
      include: {
        crucesPerifericos: {
          include: {
            cruce: true,
          },
        },
      },
    });

    if (!periferico) {
      throw new NotFoundException(`Periférico con ID ${id} no encontrado`);
    }

    return periferico;
  }

  async update(id: number, updatePerifericoDto: UpdatePerifericoDto) {
    await this.findOne(id);

    return this.prisma.periferico.update({
      where: { id },
      data: {
        ...updatePerifericoDto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.periferico.delete({
      where: { id },
    });
  }
}
