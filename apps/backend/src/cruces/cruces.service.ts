import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCruceDto } from './dto/create-cruce.dto';
import { UpdateCruceDto } from './dto/update-cruce.dto';
import { QueryCrucesDto } from './dto/query-cruces.dto';
import { Prisma } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class CrucesService {
  constructor(private prisma: PrismaService) {}

  async create(createCruceDto: CreateCruceDto, userId?: number) {
    const { ubigeoId, proyectoId, administradorId, via1, via2, ...resto } = createCruceDto;
    
    const data: any = {
      ...resto,
      ubigeo: { connect: { id: ubigeoId } },
      proyecto: { connect: { id: proyectoId } },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Manejar relaciones opcionales
    if (administradorId) {
      data.administrador = { connect: { id: administradorId } };
    }
    
    if (via1) {
      data.via1 = Number(via1);
    }
    
    if (via2) {
      data.via2 = Number(via2);
    }

    // Crear el cruce (sin geom, ya que es Unsupported)
    const cruce = await this.prisma.cruce.create({
      data,
      include: {
        ubigeo: true,
        proyecto: true,
        administrador: true,
        crucesPerifericos: {
          include: {
            periferico: true,
          },
        },
      },
    });

    // Si hay latitud y longitud, actualizar la geometría PostGIS con query raw
    if (createCruceDto.latitud && createCruceDto.longitud) {
      await this.prisma.$executeRaw`
        UPDATE cruces 
        SET geom = ST_SetSRID(ST_MakePoint(${createCruceDto.longitud}, ${createCruceDto.latitud}), 4326)
        WHERE id = ${cruce.id}
      `;
    }

    return cruce;
  }

  async findAll(query: QueryCrucesDto) {
    const { page = 1, limit = 10, search, codigo, estado, ubigeoId, proyectoId, sortBy = 'id', sortOrder = 'desc' } = query;

    const where: any = {};

    if (search) {
      where.nombre = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (codigo) {
      where.codigo = {
        contains: codigo,
        mode: 'insensitive',
      };
    }

    if (estado !== undefined) {
      where.estado = estado;
    }

    if (ubigeoId) {
      where.ubigeoId = ubigeoId;
    }

    if (proyectoId) {
      where.proyectoId = proyectoId;
    }

    const [total, data] = await Promise.all([
      this.prisma.cruce.count({ where }),
      this.prisma.cruce.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          ubigeo: true,
          proyecto: true,
          administrador: true,
          crucesPerifericos: {
            include: {
              periferico: true,
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
    const cruce = await this.prisma.cruce.findUnique({
      where: { id },
      include: {
        ubigeo: true,
        proyecto: true,
        administrador: true,
        crucesPerifericos: {
          include: {
            periferico: true,
          },
        },
      },
    });

    if (!cruce) {
      throw new NotFoundException(`Cruce con ID ${id} no encontrado`);
    }

    return cruce;
  }

  async update(id: number, updateCruceDto: UpdateCruceDto) {
    await this.findOne(id); // Verificar que existe

    const { ubigeoId, proyectoId, administradorId, via1, via2, ...resto } = updateCruceDto;
    
    const data: any = {
      ...resto,
      updatedAt: new Date(),
    };

    // Manejar relaciones obligatorias
    if (ubigeoId !== undefined) {
      data.ubigeo = { connect: { id: ubigeoId } };
    }
    
    if (proyectoId !== undefined) {
      data.proyecto = { connect: { id: proyectoId } };
    }
    
    // Manejar relaciones opcionales
    if (administradorId !== undefined) {
      if (administradorId === null) {
        data.administrador = { disconnect: true };
      } else {
        data.administrador = { connect: { id: Number(administradorId) } };
      }
    }
    
    if (via1 !== undefined) {
      data.via1 = via1 === null ? null : Number(via1);
    }
    
    if (via2 !== undefined) {
      data.via2 = via2 === null ? null : Number(via2);
    }

    // Actualizar el cruce (sin geom, ya que es Unsupported)
    const updatedCruce = await this.prisma.cruce.update({
      where: { id },
      data,
      include: {
        ubigeo: true,
        proyecto: true,
        administrador: true,
        crucesPerifericos: {
          include: {
            periferico: true,
          },
        },
      },
    });

    // Si se actualizan las coordenadas, actualizar la geometría con query raw
    if (updateCruceDto.latitud !== undefined && updateCruceDto.longitud !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE cruces 
        SET geom = ST_SetSRID(ST_MakePoint(${updateCruceDto.longitud}, ${updateCruceDto.latitud}), 4326)
        WHERE id = ${id}
      `;
    }

    return updatedCruce;
  }

  async remove(id: number) {
    await this.findOne(id); // Verificar que existe

    return this.prisma.cruce.update({
      where: { id },
      data: {
        estado: false,
        updatedAt: new Date(),
      },
    });
  }

  // Gestión de periféricos
  async addPeriferico(cruceId: number, perifericoId: number) {
    await this.findOne(cruceId);

    // Verificar que el periférico existe
    const periferico = await this.prisma.periferico.findUnique({
      where: { id: perifericoId },
    });

    if (!periferico) {
      throw new NotFoundException(`Periférico con ID ${perifericoId} no encontrado`);
    }

    // Verificar si ya existe la relación
    const existing = await this.prisma.crucePeriferico.findFirst({
      where: {
        cruceId,
        perifericoId,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.crucePeriferico.create({
      data: {
        cruceId,
        perifericoId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        periferico: true,
      },
    });
  }

  async removePeriferico(cruceId: number, perifericoId: number) {
    const relation = await this.prisma.crucePeriferico.findFirst({
      where: {
        cruceId,
        perifericoId,
      },
    });

    if (!relation) {
      throw new NotFoundException(`Relación no encontrada`);
    }

    return this.prisma.crucePeriferico.delete({
      where: { id: relation.id },
    });
  }

  async getPerifericos(cruceId: number) {
    await this.findOne(cruceId);

    return this.prisma.crucePeriferico.findMany({
      where: { cruceId },
      include: {
        periferico: true,
      },
    });
  }

  // Búsqueda para autocomplete
  async search(query: string, limit: number = 20) {
    return this.prisma.cruce.findMany({
      where: {
        OR: [
          {
            nombre: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            codigo: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
        estado: true,
      },
      take: limit,
      select: {
        id: true,
        nombre: true,
        codigo: true,
        latitud: true,
        longitud: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }
}
