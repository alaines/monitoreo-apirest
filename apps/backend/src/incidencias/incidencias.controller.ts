import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IncidenciasService } from './incidencias.service';
import { CreateIncidenciaDto, UpdateIncidenciaDto, IncidenciaResponseDto } from './incidencias.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('incidencias')
@ApiBearerAuth()
@Controller('incidencias')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IncidenciasController {
  constructor(private readonly incidenciasService: IncidenciasService) {}

  @Get()
  @RequirePermission('incidencias', 'view')
  @ApiOperation({ summary: 'Listar todos los tipos de incidencias' })
  async findAll(): Promise<IncidenciaResponseDto[]> {
    return this.incidenciasService.findAll();
  }

  @Get(':id')
  @RequirePermission('incidencias', 'view')
  @ApiOperation({ summary: 'Obtener una incidencia por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<IncidenciaResponseDto> {
    return this.incidenciasService.findOne(id);
  }

  @Post()
  @RequirePermission('incidencias', 'create')
  @ApiOperation({ summary: 'Crear un nuevo tipo de incidencia' })
  async create(@Body() createIncidenciaDto: CreateIncidenciaDto): Promise<IncidenciaResponseDto> {
    return this.incidenciasService.create(createIncidenciaDto);
  }

  @Patch(':id')
  @RequirePermission('incidencias', 'edit')
  @ApiOperation({ summary: 'Actualizar un tipo de incidencia' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIncidenciaDto: UpdateIncidenciaDto,
  ): Promise<IncidenciaResponseDto> {
    return this.incidenciasService.update(id, updateIncidenciaDto);
  }

  @Delete(':id')
  @RequirePermission('incidencias', 'delete')
  @ApiOperation({ summary: 'Desactivar un tipo de incidencia (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<IncidenciaResponseDto> {
    return this.incidenciasService.remove(id);
  }
}
