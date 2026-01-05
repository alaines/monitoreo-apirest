import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto } from './areas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('areas')
@ApiBearerAuth()
@Controller('areas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  @RequirePermission('areas', 'view')
  @ApiOperation({ summary: 'Listar todas las áreas' })
  async findAll(): Promise<AreaResponseDto[]> {
    return this.areasService.findAll();
  }

  @Get(':id')
  @RequirePermission('areas', 'view')
  @ApiOperation({ summary: 'Obtener un área por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AreaResponseDto> {
    return this.areasService.findOne(id);
  }

  @Post()
  @RequirePermission('areas', 'create')
  @ApiOperation({ summary: 'Crear una nueva área' })
  async create(@Body() createAreaDto: CreateAreaDto): Promise<AreaResponseDto> {
    return this.areasService.create(createAreaDto);
  }

  @Patch(':id')
  @RequirePermission('areas', 'edit')
  @ApiOperation({ summary: 'Actualizar un área' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAreaDto: UpdateAreaDto,
  ): Promise<AreaResponseDto> {
    return this.areasService.update(id, updateAreaDto);
  }

  @Delete(':id')
  @RequirePermission('areas', 'delete')
  @ApiOperation({ summary: 'Desactivar un área (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<AreaResponseDto> {
    return this.areasService.remove(id);
  }
}
