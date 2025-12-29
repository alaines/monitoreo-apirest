import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';

@Injectable()
export class IncidentsService {
  constructor(private prisma: PrismaService) {}

  async create(createIncidentDto: CreateIncidentDto, usuario: string) {
    const { latitude, longitude, ...data } = createIncidentDto;

    // Crear el punto geográfico en formato WKT (Well-Known Text)
    const point = `POINT(${longitude} ${latitude})`;

    const ticket = await this.prisma.$executeRawUnsafe(
      `INSERT INTO tickets (
        incidencia_id, prioridade_id, cruce_id, descripcion,
        reportadore_nombres, reportadore_dato_contacto, reportadore_id,
        usuario_registra, created, modified, geom
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), ST_GeomFromText($9, 4326))
      RETURNING *`,
      data.incidenciaId,
      data.prioridadId || null,
      data.cruceId || null,
      data.descripcion,
      data.reportadorNombres || null,
      data.reportadorDatoContacto || null,
      data.reportadorId || null,
      usuario,
      point,
    );

    // Obtener el ticket recién creado
    return this.findOne(ticket as any);
  }

  async findAll(query: QueryIncidentsDto) {
    const { page = 1, limit = 10, estadoId, incidenciaId, equipoId, cruceId, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (estadoId) where.estadoId = estadoId;
    if (incidenciaId) where.incidenciaId = incidenciaId;
    if (equipoId) where.equipoId = equipoId;
    if (cruceId) where.cruceId = cruceId;
    if (search) {
      where.descripcion = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          incidencia: true,
          cruce: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              latitud: true,
              longitud: true,
            },
          },
          equipo: true,
          reportador: true,
          seguimientos: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              estado: true,
              responsable: true,
            },
          },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    // Obtener coordenadas de cada ticket
    const ticketsWithCoords = await Promise.all(
      tickets.map(async (ticket) => {
        const coords = await this.getCoordinates(ticket.id);
        return {
          ...ticket,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        };
      }),
    );

    return {
      data: ticketsWithCoords,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        incidencia: true,
        cruce: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            latitud: true,
            longitud: true,
          },
        },
        equipo: true,
        reportador: true,
        seguimientos: {
          orderBy: { createdAt: 'desc' },
          include: {
            estado: true,
            responsable: true,
            equipo: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    const coords = await this.getCoordinates(id);

    return {
      ...ticket,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    };
  }

  async update(id: number, updateIncidentDto: UpdateIncidentDto, usuario: string) {
    await this.findOne(id); // Verificar que existe

    const { latitude, longitude, estadoId, ...data } = updateIncidentDto;

    // Si hay cambio de estado, crear seguimiento
    if (estadoId) {
      await this.prisma.ticketSeguimiento.create({
        data: {
          ticketId: id,
          estadoId,
          equipoId: data.equipoId,
          usuarioRegistra: usuario,
          reporte: 'Estado actualizado',
        },
      });

      // Actualizar el estado del ticket
      await this.prisma.ticket.update({
        where: { id },
        data: { estadoId },
      });
    }

    // Actualizar el ticket
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // Si hay coordenadas nuevas
    if (latitude && longitude) {
      const point = `POINT(${longitude} ${latitude})`;
      await this.prisma.$executeRawUnsafe(
        `UPDATE tickets SET geom = ST_GeomFromText($1, 4326) WHERE id = $2`,
        point,
        id,
      );
    }

    await this.prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id); // Verificar que existe

    await this.prisma.ticket.delete({
      where: { id },
    });

    return { message: 'Ticket eliminado correctamente' };
  }

  async getStatistics() {
    const [total, pendientes, enProceso, resueltas] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { estadoId: 1 } }),
      this.prisma.ticket.count({ where: { estadoId: 2 } }),
      this.prisma.ticket.count({ where: { estadoId: 3 } }),
    ]);

    return {
      total,
      pendientes,
      enProceso,
      resueltas,
    };
  }

  async getIncidenciasCatalog() {
    const incidencias = await this.prisma.incidencia.findMany({
      where: { estado: true },
      select: {
        id: true,
        tipo: true,
        caracteristica: true,
        parentId: true,
      },
    });

    // Crear un mapa de incidencias por ID para búsqueda rápida
    const incidenciasMap = new Map(incidencias.map(inc => [inc.id, inc]));

    // Construir el nombre completo con jerarquía
    const resultado = incidencias.map(inc => {
      let nombreCompleto = inc.tipo || '';
      let nombrePadre = '';
      
      if (inc.parentId) {
        // Si tiene padre, mostrar: Padre > Hijo
        const parent = incidenciasMap.get(inc.parentId);
        if (parent) {
          nombrePadre = parent.tipo || '';
          nombreCompleto = `${nombrePadre} > ${inc.tipo}`;
        }
      } else {
        // Si es padre (no tiene parentId), mostrar: Categoría Principal > General
        nombrePadre = inc.tipo || '';
        nombreCompleto = `${inc.tipo} > General`;
      }

      return {
        id: inc.id,
        tipo: nombreCompleto,
        caracteristica: inc.caracteristica,
        nombrePadre, // Para ordenamiento
      };
    });

    // Ordenar por nombre del padre, luego por nombre completo
    resultado.sort((a, b) => {
      const comparePadre = a.nombrePadre.localeCompare(b.nombrePadre);
      if (comparePadre !== 0) return comparePadre;
      return a.tipo.localeCompare(b.tipo);
    });

    // Remover el campo temporal de ordenamiento
    return resultado.map(({ nombrePadre, ...rest }) => rest);
  }

  async getPrioridadesCatalog() {
    return this.prisma.prioridad.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async getEstadosCatalog() {
    return this.prisma.estado.findMany({
      where: { estado: true },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async getCrucesCatalog() {
    return this.prisma.cruce.findMany({
      where: { estado: true },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  private async getCoordinates(ticketId: number): Promise<{ latitude: number; longitude: number } | null> {
    const result: any = await this.prisma.$queryRawUnsafe(
      `SELECT ST_X(geom) as longitude, ST_Y(geom) as latitude FROM tickets WHERE id = $1`,
      ticketId,
    );

    if (result && result.length > 0 && result[0].latitude && result[0].longitude) {
      return {
        latitude: parseFloat(result[0].latitude),
        longitude: parseFloat(result[0].longitude),
      };
    }

    return null;
  }
}
