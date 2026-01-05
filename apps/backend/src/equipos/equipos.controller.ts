import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EquiposService } from './equipos.service';
import { CreateEquipoDto, UpdateEquipoDto, EquipoResponseDto } from './equipos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('equipos')
@ApiBearerAuth()
@Controller('equipos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  @Get()
  @RequirePermission('equipos', 'view')
  @ApiOperation({ summary: 'Listar todos los equipos' })
  async findAll(): Promise<EquipoResponseDto[]> {
    return this.equiposService.findAll();
  }

  @Get(':id')
  @RequirePermission('equipos', 'view')
  @ApiOperation({ summary: 'Obtener un equipo por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<EquipoResponseDto> {
    return this.equiposService.findOne(id);
  }

  @Post()
  @RequirePermission('equipos', 'create')
  @ApiOperation({ summary: 'Crear un nuevo equipo' })
  async create(@Body() createEquipoDto: CreateEquipoDto): Promise<EquipoResponseDto> {
    return this.equiposService.create(createEquipoDto);
  }

  @Patch(':id')
  @RequirePermission('equipos', 'edit')
  @ApiOperation({ summary: 'Actualizar un equipo' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipoDto: UpdateEquipoDto,
  ): Promise<EquipoResponseDto> {
    return this.equiposService.update(id, updateEquipoDto);
  }

  @Delete(':id')
  @RequirePermission('equipos', 'delete')
  @ApiOperation({ summary: 'Desactivar un equipo (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<EquipoResponseDto> {
    return this.equiposService.remove(id);
  }
}
