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

    // Enviar notificación a los usuarios
    try {
      const isCritical = CRITICAL_INCIDENT_IDS.includes(createIncidentDto.incidenciaId);
      const incidenciaTipo = ticket.incidencia?.tipo || 'Nueva Incidencia';
      const cruceNombre = ticket.cruce?.nombre || `Cruce #${ticket.cruceId}`;
      
      await this.notificationsService.notifyNewIncidencia(
        ticketId,
        incidenciaTipo,
        cruceNombre,
        ticket.descripcion || '',
        isCritical,
      );
    } catch (error) {
      console.error('Error al enviar notificación de nueva incidencia:', error);
    }

    return ticket;
  }

  async findAll(query: QueryIncidentsDto) {
    const { page = 1, limit = 10, estadoId, incidenciaId, equipoId, cruceId, administradorId, anho, search, fechaDesde, fechaHasta } = query as any;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (estadoId) {
      if (typeof estadoId === 'string') {
        const ids = estadoId.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (ids.length === 1) {
          where.estadoId = ids[0];
        } else if (ids.length > 1) {
          where.estadoId = { in: ids };
        }
      } else if (Array.isArray(estadoId)) {
        where.estadoId = { in: estadoId.map(Number) };
      } else {
        where.estadoId = Number(estadoId);
      }
    }

    if (incidenciaId) {
      const incId = Number(incidenciaId);
      const children = await this.prisma.incidencia.findMany({
        where: { parentId: incId, estado: true },
        select: { id: true },
      });
      if (children.length > 0) {
        where.incidenciaId = { in: [incId, ...children.map(c => c.id)] };
      } else {
        where.incidenciaId = incId;
      }
    }
    if (equipoId) where.equipoId = Number(equipoId);
    if (cruceId) where.cruceId = Number(cruceId);
    if (anho) where.anho = Number(anho);
    
    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) {
        where.createdAt.gte = new Date(`${fechaDesde}T00:00:00.000Z`);
      }
      if (fechaHasta) {
        where.createdAt.lte = new Date(`${fechaHasta}T23:59:59.999Z`);
      }
    }
    
    // Filtro por administrador a través de la relación con cruce
    if (administradorId) {
      where.cruce = {
        administradorId: Number(administradorId),
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

    // Asignar coordenadas a cada ticket desde el cruce asociado
    const ticketsWithCoords = tickets.map((ticket) => ({
      ...ticket,
      latitude: ticket.cruce?.latitud ? Number(ticket.cruce.latitud) : null,
      longitude: ticket.cruce?.longitud ? Number(ticket.cruce.longitud) : null,
    }));

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
      throw new NotFoundException(`Incidencia con ID ${id} no encontrada`);
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

    const updatedTicket = await this.findOne(id);

    try {
      this.notificationsGateway.broadcastIncidentUpdated(updatedTicket);
      const cruceNombre = updatedTicket.cruce?.nombre || `Cruce #${updatedTicket.cruceId}`;
      await this.notificationsService.notifyIncidenciaUpdated(id, cruceNombre, 'Datos actualizados');
    } catch (error) {
      console.error('Error broadcasting incident update:', error);
    }

    return updatedTicket;
  }

  async remove(id: number) {
    await this.findOne(id); // Verificar que existe

    await this.prisma.ticket.delete({
      where: { id },
    });

    return { message: 'Ticket eliminado correctamente' };
  }

  async getStatistics() {
    const [total, pendientes, enProceso, reasignadas, resueltas] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { estadoId: 1 } }), // ASIGNADO
      this.prisma.ticket.count({ where: { estadoId: 2 } }), // EN PROCESO
      this.prisma.ticket.count({ where: { estadoId: 5 } }), // REASIGNADO
      this.prisma.ticket.count({ where: { estadoId: { in: [3, 4] } } }), // CANCELADO / RESUELTO
    ]);

    return {
      total,
      pendientes: pendientes + reasignadas,
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
          in: [1, 2, 5], // Asignado, En Proceso, Reasignado
        },
      },
    });

    return { count };
  }

  async getMapMarkers(query: QueryIncidentsDto) {
    const { page, limit, estadoId, administradorId, anho, mes, year, month, incidenciaId, allStates, caracteristica, prioridadId } = query;
    const takeAmount = limit && limit > 10 ? limit : 10000;
    const skipAmount = page && page > 1 ? (page - 1) * takeAmount : 0;

    const where: any = {
      cruce: {
        latitud: { not: null },
        longitud: { not: null },
      },
    };

    // Si se envía estadoId explícito, usarlo.
    // Si se envía allStates = true (mapas de calor o reportes históricos), incluir todos los estados.
    // De lo contrario, para el monitoreo en vivo por defecto, SOLO incidencias activas: ASIGNADO (1), EN PROCESO (2), REASIGNADO (5).
    if (estadoId) {
      where.estadoId = estadoId;
    } else if (allStates) {
      // No restringir estadoId
    } else {
      where.estadoId = { in: [1, 2, 5] };
    }

    if (anho) where.anho = Number(anho);
    if (mes) where.mes = Number(mes);
    
    // Filtros de fecha para mapa de calor y reportes
    if (year && month) {
      const yearValue = Number(year);
      const monthValue = Number(month);
      const nextMonth = monthValue === 12 ? 1 : monthValue + 1;
      const nextYear = monthValue === 12 ? yearValue + 1 : yearValue;
      
      const yearMonth = `${yearValue}-${String(monthValue).padStart(2, '0')}`;
      const nextYearMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
      
      where.createdAt = {
        gte: new Date(`${yearMonth}-01T00:00:00.000Z`),
        lt: new Date(`${nextYearMonth}-01T00:00:00.000Z`),
      };
    } else if (year && !month) {
      const yearValue = Number(year);
      where.createdAt = {
        gte: new Date(`${yearValue}-01-01T00:00:00.000Z`),
        lt: new Date(`${yearValue + 1}-01-01T00:00:00.000Z`),
      };
    } else if (!year && month) {
      const yearValue = new Date().getFullYear();
      const monthValue = Number(month);
      const nextMonth = monthValue === 12 ? 1 : monthValue + 1;
      const nextYear = monthValue === 12 ? yearValue + 1 : yearValue;
      
      const yearMonth = `${yearValue}-${String(monthValue).padStart(2, '0')}`;
      const nextYearMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
      
      where.createdAt = {
        gte: new Date(`${yearMonth}-01T00:00:00.000Z`),
        lt: new Date(`${nextYearMonth}-01T00:00:00.000Z`),
      };
    }
    
    // Filtro por tipo de incidencia
    if (incidenciaId) {
      where.incidenciaId = incidenciaId;
    }

    // Filtro por característica (I = Incidencia, T = Tareas/Trabajos)
    if (caracteristica) {
      where.incidencia = {
        ...where.incidencia,
        caracteristica: caracteristica,
      };
    }

    // Filtro por prioridad (1 = ALTA, 2 = MEDIA, 3 = BAJA)
    if (prioridadId) {
      where.OR = [
        { prioridadId: Number(prioridadId) },
        { incidencia: { prioridadId: Number(prioridadId) } },
      ];
    }
    
    // Filtro por administrador a través de la relación con cruce
    if (administradorId) {
      where.cruce = {
        ...where.cruce,
        administradorId: administradorId,
      };
    }

    // Consulta ligera - solo campos necesarios para markers
    const tickets = await this.prisma.ticket.findMany({
      where,
      skip: skipAmount,
      take: takeAmount,
      select: {
        id: true,
        anho: true,
        mes: true,
        incidenciaId: true,
        prioridadId: true,
        estadoId: true,
        createdAt: true,
        estado: {
          select: {
            id: true,
            nombre: true,
          },
        },
        incidencia: {
          select: {
            id: true,
            tipo: true,
            caracteristica: true,
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
            codigo: true,
            latitud: true,
            longitud: true,
            ubigeo: {
              select: {
                distrito: true,
              },
            },
            administrador: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Combinar datos con coordenadas validadas y normalizadas desde el cruce
    const result = tickets
      .map((ticket) => {
        if (!ticket.cruce || ticket.cruce.latitud == null || ticket.cruce.longitud == null) return null;
        let lat = Number(ticket.cruce.latitud);
        let lng = Number(ticket.cruce.longitud);
        if (isNaN(lat) || isNaN(lng)) return null;

        // Normalizar en caso vengan enteros sin punto decimal
        while (Math.abs(lat) > 90) lat = lat / 10;
        while (Math.abs(lng) > 180) lng = lng / 10;

        if (lat === 0 && lng === 0) return null;

        return {
          ...ticket,
          latitude: lat,
          longitude: lng,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    return {
      data: result,
      meta: {
        total: result.length,
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
    const incidenciasMap = new Map<number, (typeof incidencias)[number]>(incidencias.map(inc => [inc.id, inc]));

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
        prioridadId: inc.prioridadId,
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
        codigo: true,
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

    try {
      const updatedTicket = await this.findOne(ticketId);
      this.notificationsGateway.broadcastIncidentUpdated(updatedTicket);
      
      const cruceNombre = updatedTicket.cruce?.nombre || `Cruce #${updatedTicket.cruceId}`;
      const estadoNombre = seguimiento.estado?.nombre || 'Seguimiento registrado';
      await this.notificationsService.notifyStatusChange(ticketId, cruceNombre, estadoNombre, usuario);
    } catch (error) {
      console.error('Error broadcasting tracking update:', error);
    }

    return seguimiento;
  }

  private async getCoordinates(ticketId: number): Promise<{ latitude: number; longitude: number } | null> {
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
        latitude: Number(ticket.cruce.latitud),
        longitude: Number(ticket.cruce.longitud),
      };
    }

    return null;
  }
}
