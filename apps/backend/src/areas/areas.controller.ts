import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto } from './areas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('areas')
@ApiBearerAuth()
@Controller('areas')
@UseGuards(JwtAuthGuard)
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  // No requiere permiso específico - usado en filtros y asignaciones
  @ApiOperation({ summary: 'Listar todas las áreas' })
  async findAll(): Promise<AreaResponseDto[]> {
    return this.areasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un área por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AreaResponseDto> {
    return this.areasService.findOne(id);
  }

  @Post()
  @RequirePermission('areas_mant', 'create')
  @ApiOperation({ summary: 'Crear una nueva área' })
  async create(@Body() createAreaDto: CreateAreaDto): Promise<AreaResponseDto> {
    return this.areasService.create(createAreaDto);
  }

  @Patch(':id')
  @RequirePermission('areas_mant', 'edit')
  @ApiOperation({ summary: 'Actualizar un área' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAreaDto: UpdateAreaDto,
  ): Promise<AreaResponseDto> {
    return this.areasService.update(id, updateAreaDto);
  }

  @Delete(':id')
  @RequirePermission('areas_mant', 'delete')
  @ApiOperation({ summary: 'Desactivar un área (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<AreaResponseDto> {
    return this.areasService.remove(id);
  }
}
