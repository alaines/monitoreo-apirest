import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

// IDs de incidencias críticas que requieren notificación
const CRITICAL_INCIDENT_IDS = [22, 3, 64, 65, 66]; // SEMAFORO INTERMITENTE, SEMAFORO VEHICULAR APAGADO, SEMAFORO PEATONAL APAGADO, SEMAFORO CICLISTA APAGADO, CRUCE APAGADO

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(createIncidentDto: CreateIncidentDto, usuario: string) {
    // Las incidencias siempre heredan coordenadas del cruce, no necesitan geom propio
    const result = await this.prisma.$queryRawUnsafe(
      `INSERT INTO tickets (
        incidencia_id, prioridade_id, cruce_id, descripcion,
        reportadore_nombres, reportadore_dato_contacto, reportadore_id,
        usuario_registra, created, modified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id`,
      createIncidentDto.incidenciaId,
      createIncidentDto.prioridadId || null,
      createIncidentDto.cruceId,
      createIncidentDto.descripcion,
      createIncidentDto.reportadorNombres || null,
      createIncidentDto.reportadorDatoContacto || null,
      createIncidentDto.reportadorId || null,
      usuario,
    );

    // Obtener el ticket recién creado
    const ticketId = (result as Array<{ id: number }>)[0].id;
    const ticket = await this.findOne(ticketId);

    // Broadcast to all connected clients that a new incident was created
    try {
      this.notificationsGateway.broadcastIncidentCreated(ticket);
    } catch (error) {
      console.error('Error broadcasting incident creation:', error);
    }

    // Enviar notificación si es una incidencia crítica
    if (CRITICAL_INCIDENT_IDS.includes(createIncidentDto.incidenciaId)) {
      try {
        const incidenciaTipo = ticket.incidencia?.tipo || 'Incidencia crítica';
        const cruceNombre = ticket.cruce?.nombre || `Cruce #${ticket.cruceId}`;
        
        // Notificar a todos los usuarios activos
        await this.notificationsService.notifyNewIncidencia(
          ticketId,
          incidenciaTipo,
          cruceNombre,
          ticket.descripcion || '',
        );
      } catch (error) {
        console.error('Error al enviar notificación de nueva incidencia:', error);
        // No fallar la creación del ticket si falla la notificación
      }
    }

    return ticket;
  }

  async findAll(query: QueryIncidentsDto) {
    const { page = 1, limit = 10, estadoId, incidenciaId, equipoId, cruceId, administradorId, anho, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (estadoId) where.estadoId = estadoId;
    if (incidenciaId) where.incidenciaId = incidenciaId;
    if (equipoId) where.equipoId = equipoId;
    if (cruceId) where.cruceId = cruceId;
    if (anho) where.anho = anho;
    
    // Filtro por administrador a través de la relación con cruce
    if (administradorId) {
      where.cruce = {
        administradorId: administradorId,
      };
    }
    
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
          incidencia: {
            include: {
              prioridad: true,
            },
          },
          cruce: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              latitud: true,
              longitud: true,
              electricoEmpresa: true,
              electricoSuministro: true,
              administrador: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
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

    // Obtener coordenadas de los tickets que las tengan en geom
    const ticketIds = tickets.map(t => t.id);
    const ticketCoords: any = await this.prisma.$queryRawUnsafe(
      `SELECT id, ST_X(geom) as longitude, ST_Y(geom) as latitude 
       FROM tickets 
       WHERE id = ANY($1) AND geom IS NOT NULL`,
      ticketIds,
    );
    
    const coordsMap = new Map();
    ticketCoords.forEach((tc: any) => {
      coordsMap.set(tc.id, {
        latitude: parseFloat(tc.latitude),
        longitude: parseFloat(tc.longitude),
      });
    });
    
    // Asignar coordenadas a cada ticket (del ticket o del cruce)
    const ticketsWithCoords = tickets.map((ticket) => {
      let latitude: number | null = null;
      let longitude: number | null = null;
      
      // Si tiene coordenadas propias, usarlas
      if (coordsMap.has(ticket.id)) {
        const coords = coordsMap.get(ticket.id);
        latitude = coords.latitude;
        longitude = coords.longitude;
      }
      // Si no, usar las del cruce si existe
      else if (ticket.cruce?.latitud && ticket.cruce?.longitud) {
        latitude = ticket.cruce.latitud;
        longitude = ticket.cruce.longitud;
      }
      
      return {
        ...ticket,
        latitude,
        longitude,
      };
    });

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
        incidencia: {
          include: {
            prioridad: true,
          },
        },
        cruce: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            latitud: true,
            longitud: true,
            electricoEmpresa: true,
            electricoSuministro: true,
            administrador: {
              select: {
                id: true,
                nombre: true,
              },
            },
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

    const { estadoId, ...data } = updateIncidentDto;

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

    // Las incidencias siempre usan coordenadas del cruce, no se actualiza geom

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
      this.prisma.ticket.count({ where: { estadoId: { in: [3, 4] } } }),
    ]);

    return {
      total,
      pendientes,
      enProceso,
      resueltas,
    };
  }

  async getAvailableYears() {
    const result = await this.prisma.$queryRaw<Array<{ anho: number }>>`
      SELECT DISTINCT anho 
      FROM tickets 
      WHERE anho IS NOT NULL 
      ORDER BY anho DESC
    `;
    
    return result.map(r => r.anho);
  }

  async getCrucesApagadosCount() {
    const count = await this.prisma.ticket.count({
      where: {
        incidenciaId: 66, // CRUCE APAGADO
        estadoId: {
          in: [1, 2, 5], // Pendiente, En Proceso, Observado
        },
      },
    });

    return { count };
  }

  async getMapMarkers(query: QueryIncidentsDto) {
    const { page = 1, limit = 10000, estadoId, administradorId, anho, year, month, incidenciaId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Solo tickets activos por defecto
    if (estadoId) {
      where.estadoId = estadoId;
    } else {
      where.estadoId = { in: [1, 2] }; // Pendiente y En Proceso
    }

    if (anho) where.anho = anho;
    
    // Filtros para mapa de calor: year y month usando created_at
    if (year || month) {
      const yearValue = year || new Date().getFullYear();
      const monthValue = month || new Date().getMonth() + 1;
      
      // Calcular el primer día del siguiente mes (manejando diciembre -> enero)
      const nextMonth = monthValue === 12 ? 1 : monthValue + 1;
      const nextYear = monthValue === 12 ? yearValue + 1 : yearValue;
      
      // Formato: YYYY-MM (ej: "2026-01")
      const yearMonth = `${yearValue}-${String(monthValue).padStart(2, '0')}`;
      const nextYearMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
      
      where.createdAt = {
        gte: new Date(`${yearMonth}-01T00:00:00.000Z`),
        lt: new Date(`${nextYearMonth}-01T00:00:00.000Z`),
      };
    }
    
    // Filtro por tipo de incidencia para mapa de calor
    if (incidenciaId) {
      where.incidenciaId = incidenciaId;
    }
    
    // Filtro por administrador a través de la relación con cruce
    if (administradorId) {
      where.cruce = {
        administradorId: administradorId,
      };
    }

    // Consulta ligera - solo campos necesarios para markers
    const tickets = await this.prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        incidenciaId: true,
        prioridadId: true,
        estadoId: true,
        createdAt: true,
        incidencia: {
          select: {
            id: true,
            tipo: true,
            prioridad: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        cruce: {
          select: {
            id: true,
            nombre: true,
            latitud: true,
            longitud: true,
            administrador: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    // Obtener coordenadas de los tickets que las tengan en geom
    const ticketIds = tickets.map(t => t.id);
    const ticketCoords: any = await this.prisma.$queryRawUnsafe(
      `SELECT id, ST_X(geom) as longitude, ST_Y(geom) as latitude 
       FROM tickets 
       WHERE id = ANY($1) AND geom IS NOT NULL`,
      ticketIds,
    );
    
    const coordsMap = new Map();
    ticketCoords.forEach((tc: any) => {
      coordsMap.set(tc.id, {
        latitude: parseFloat(tc.latitude),
        longitude: parseFloat(tc.longitude),
      });
    });

    // Combinar datos con coordenadas
    const result = tickets.map(ticket => {
      const coords = coordsMap.get(ticket.id);
      return {
        ...ticket,
        latitude: coords?.latitude || ticket.cruce?.latitud || null,
        longitude: coords?.longitude || ticket.cruce?.longitud || null,
      };
    });

    return {
      data: result,
      meta: {
        total: tickets.length,
      },
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
        prioridadId: true,
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
        prioridadeId: inc.prioridadId,
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

  async getEquiposCatalog() {
    return this.prisma.equipo.findMany({
      where: { estado: true },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async getReportadoresCatalog() {
    return this.prisma.reportador.findMany({
      where: { estado: true },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async getTrackings(ticketId: number) {
    await this.findOne(ticketId); // Verificar que existe

    return this.prisma.ticketSeguimiento.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
      include: {
        estado: true,
        equipo: true,
        responsable: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  async createTracking(ticketId: number, createTrackingDto: any, usuario: string) {
    await this.findOne(ticketId); // Verificar que existe

    const { equipoId, responsableId, reporte, estadoId } = createTrackingDto;

    // Preparar datos para crear el seguimiento
    const trackingData: any = {
      ticketId,
      reporte,
      usuarioRegistra: usuario,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Solo agregar campos opcionales si tienen valor
    if (equipoId) trackingData.equipoId = equipoId;
    if (responsableId) trackingData.responsableId = responsableId;
    if (estadoId) trackingData.estadoId = estadoId;

    // Crear el seguimiento
    const seguimiento = await this.prisma.ticketSeguimiento.create({
      data: trackingData,
      include: {
        estado: true,
        equipo: true,
        responsable: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Si hay cambio de estado, actualizar el ticket
    if (estadoId) {
      const updateData: any = {
        estadoId,
        updatedAt: new Date(),
      };
      
      if (equipoId) updateData.equipoId = equipoId;

      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: updateData,
      });
    }

    return seguimiento;
  }

  private async getCoordinates(ticketId: number): Promise<{ latitude: number; longitude: number } | null> {
    // Primero intentar obtener las coordenadas del ticket
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

    // Si no tiene coordenadas propias, obtener las del cruce asociado
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        cruce: {
          select: {
            latitud: true,
            longitud: true,
          },
        },
      },
    });

    if (ticket?.cruce?.latitud && ticket?.cruce?.longitud) {
      return {
        latitude: ticket.cruce.latitud,
        longitude: ticket.cruce.longitud,
      };
    }

    return null;
  }
}
