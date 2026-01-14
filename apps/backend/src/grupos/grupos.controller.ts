import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GruposService } from './grupos.service';
import { CreateGrupoDto, UpdateGrupoDto } from './dto/grupo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('grupos')
@ApiBearerAuth()
@Controller('grupos')
@UseGuards(JwtAuthGuard)
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Get()
  // No requiere permiso específico - usado en filtros y asignación de usuarios
  @ApiOperation({ summary: 'Obtener todos los grupos' })
  findAll() {
    return this.gruposService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un grupo por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gruposService.findOne(id);
  }

  @Post()
  @RequirePermission('grupos', 'create')
  @ApiOperation({ summary: 'Crear un nuevo grupo' })
  create(@Body() createGrupoDto: CreateGrupoDto) {
    return this.gruposService.create(createGrupoDto);
  }

  @Patch(':id')
  @RequirePermission('grupos', 'edit')
  @ApiOperation({ summary: 'Actualizar un grupo' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateGrupoDto: UpdateGrupoDto) {
    return this.gruposService.update(id, updateGrupoDto);
  }

  @Delete(':id')
  @RequirePermission('grupos', 'delete')
  @ApiOperation({ summary: 'Eliminar un grupo (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gruposService.remove(id);
  }
}
