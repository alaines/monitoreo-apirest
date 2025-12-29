import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva incidencia' })
  @ApiResponse({ status: 201, description: 'Incidencia creada exitosamente' })
  create(@Body() createIncidentDto: CreateIncidentDto, @CurrentUser() user: any) {
    return this.incidentsService.create(createIncidentDto, user.usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las incidencias con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de incidencias' })
  findAll(@Query() query: QueryIncidentsDto) {
    return this.incidentsService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obtener estadísticas de incidencias' })
  @ApiResponse({ status: 200, description: 'Estadísticas generales' })
  getStatistics() {
    return this.incidentsService.getStatistics();
  }

  @Get('catalogs/incidencias')
  @ApiOperation({ summary: 'Obtener catálogo de tipos de incidencias' })
  @ApiResponse({ status: 200, description: 'Tipos de incidencias' })
  async getIncidenciasCatalog() {
    return this.incidentsService.getIncidenciasCatalog();
  }

  @Get('catalogs/prioridades')
  @ApiOperation({ summary: 'Obtener catálogo de prioridades' })
  @ApiResponse({ status: 200, description: 'Prioridades' })
  async getPrioridadesCatalog() {
    return this.incidentsService.getPrioridadesCatalog();
  }

  @Get('catalogs/estados')
  @ApiOperation({ summary: 'Obtener catálogo de estados' })
  @ApiResponse({ status: 200, description: 'Estados' })
  async getEstadosCatalog() {
    return this.incidentsService.getEstadosCatalog();
  }

  @Get('catalogs/cruces')
  @ApiOperation({ summary: 'Obtener catálogo de cruces/intersecciones' })
  @ApiResponse({ status: 200, description: 'Cruces' })
  async getCrucesCatalog() {
    return this.incidentsService.getCrucesCatalog();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una incidencia' })
  @ApiResponse({ status: 200, description: 'Detalle de la incidencia' })
  @ApiResponse({ status: 404, description: 'Incidencia no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar incidencia' })
  @ApiResponse({ status: 200, description: 'Incidencia actualizada' })
  @ApiResponse({ status: 404, description: 'Incidencia no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIncidentDto: UpdateIncidentDto,
    @CurrentUser() user: any,
  ) {
    return this.incidentsService.update(id, updateIncidentDto, user.usuario);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar incidencia' })
  @ApiResponse({ status: 200, description: 'Incidencia eliminada' })
  @ApiResponse({ status: 404, description: 'Incidencia no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.incidentsService.remove(id);
  }
}
