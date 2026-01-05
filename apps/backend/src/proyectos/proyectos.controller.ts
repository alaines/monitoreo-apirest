import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProyectosService } from './proyectos.service';
import { CreateProyectoDto, UpdateProyectoDto, ProyectoResponseDto } from './proyectos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('proyectos')
@ApiBearerAuth()
@Controller('proyectos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Get()
  @RequirePermission('proyectos', 'view')
  @ApiOperation({ summary: 'Listar todos los proyectos' })
  async findAll(): Promise<ProyectoResponseDto[]> {
    return this.proyectosService.findAll();
  }

  @Get(':id')
  @RequirePermission('proyectos', 'view')
  @ApiOperation({ summary: 'Obtener un proyecto por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ProyectoResponseDto> {
    return this.proyectosService.findOne(id);
  }

  @Post()
  @RequirePermission('proyectos', 'create')
  @ApiOperation({ summary: 'Crear un nuevo proyecto' })
  async create(@Body() createProyectoDto: CreateProyectoDto): Promise<ProyectoResponseDto> {
    return this.proyectosService.create(createProyectoDto);
  }

  @Patch(':id')
  @RequirePermission('proyectos', 'edit')
  @ApiOperation({ summary: 'Actualizar un proyecto' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProyectoDto: UpdateProyectoDto,
  ): Promise<ProyectoResponseDto> {
    return this.proyectosService.update(id, updateProyectoDto);
  }

  @Delete(':id')
  @RequirePermission('proyectos', 'delete')
  @ApiOperation({ summary: 'Desactivar un proyecto (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ProyectoResponseDto> {
    return this.proyectosService.remove(id);
  }
}
