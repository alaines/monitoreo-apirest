import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ResponsablesService } from './responsables.service';
import { CreateResponsableDto, UpdateResponsableDto, ResponsableResponseDto } from './responsables.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('responsables')
@ApiBearerAuth()
@Controller('responsables')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResponsablesController {
  constructor(private readonly responsablesService: ResponsablesService) {}

  @Get()
  @RequirePermission('responsables', 'view')
  @ApiOperation({ summary: 'Listar todos los responsables' })
  async findAll(): Promise<ResponsableResponseDto[]> {
    return this.responsablesService.findAll();
  }

  @Get('equipo/:equipoId')
  @RequirePermission('responsables', 'view')
  @ApiOperation({ summary: 'Listar responsables por equipo' })
  async findByEquipo(@Param('equipoId', ParseIntPipe) equipoId: number): Promise<ResponsableResponseDto[]> {
    return this.responsablesService.findByEquipo(equipoId);
  }

  @Get(':id')
  @RequirePermission('responsables', 'view')
  @ApiOperation({ summary: 'Obtener un responsable por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponsableResponseDto> {
    return this.responsablesService.findOne(id);
  }

  @Post()
  @RequirePermission('responsables', 'create')
  @ApiOperation({ summary: 'Crear un nuevo responsable' })
  async create(@Body() createResponsableDto: CreateResponsableDto): Promise<ResponsableResponseDto> {
    return this.responsablesService.create(createResponsableDto);
  }

  @Patch(':id')
  @RequirePermission('responsables', 'edit')
  @ApiOperation({ summary: 'Actualizar un responsable' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResponsableDto: UpdateResponsableDto,
  ): Promise<ResponsableResponseDto> {
    return this.responsablesService.update(id, updateResponsableDto);
  }

  @Delete(':id')
  @RequirePermission('responsables', 'delete')
  @ApiOperation({ summary: 'Desactivar un responsable (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponsableResponseDto> {
    return this.responsablesService.remove(id);
  }
}
