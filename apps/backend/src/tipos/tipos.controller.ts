import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TiposService } from './tipos.service';
import { CreateTipoDto, UpdateTipoDto, TipoResponseDto } from './tipos.dto';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

@ApiTags('tipos')
@ApiBearerAuth()
@Controller('tipos')
@UseInterceptors(AuditInterceptor)
export class TiposController {
  constructor(private readonly tiposService: TiposService) {}

  @Get('hierarchical')
  @RequirePermission('catalogos', 'view')
  @ApiOperation({ summary: 'Obtener tipos organizados jerárquicamente' })
  @ApiResponse({
    status: 200,
    description: 'Árbol de tipos',
    type: [TipoResponseDto],
  })
  findAllHierarchical() {
    return this.tiposService.findAllHierarchical();
  }

  @Get('roots')
  @RequirePermission('catalogos', 'view')
  @ApiOperation({ summary: 'Obtener solo tipos raíz (sin padre)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tipos raíz',
    type: [TipoResponseDto],
  })
  findRoots() {
    return this.tiposService.findRoots();
  }

  @Get()
  @RequirePermission('catalogos', 'view')
  @ApiOperation({ summary: 'Obtener todos los tipos (lista plana)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tipos',
    type: [TipoResponseDto],
  })
  findAll() {
    return this.tiposService.findAll();
  }

  @Get(':id')
  @RequirePermission('catalogos', 'view')
  @ApiOperation({ summary: 'Obtener un tipo por ID con sus hijos' })
  @ApiResponse({
    status: 200,
    description: 'Tipo encontrado',
    type: TipoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tipo no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tiposService.findOne(id);
  }

  @Get(':id/children')
  @RequirePermission('catalogos', 'view')
  @ApiOperation({ summary: 'Obtener hijos de un tipo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de hijos',
    type: [TipoResponseDto],
  })
  findChildren(@Param('id', ParseIntPipe) id: number) {
    return this.tiposService.findChildren(id);
  }

  @Post()
  @RequirePermission('catalogos', 'create')
  @ApiOperation({ summary: 'Crear un nuevo tipo' })
  @ApiResponse({
    status: 201,
    description: 'Tipo creado exitosamente',
    type: TipoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tipo padre no encontrado' })
  create(@Body() createTipoDto: CreateTipoDto) {
    return this.tiposService.create(createTipoDto);
  }

  @Patch(':id')
  @RequirePermission('catalogos', 'edit')
  @ApiOperation({ summary: 'Actualizar un tipo' })
  @ApiResponse({
    status: 200,
    description: 'Tipo actualizado exitosamente',
    type: TipoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tipo no encontrado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTipoDto: UpdateTipoDto,
  ) {
    return this.tiposService.update(id, updateTipoDto);
  }

  @Delete(':id')
  @RequirePermission('catalogos', 'delete')
  @ApiOperation({ summary: 'Eliminar un tipo (soft delete)' })
  @ApiResponse({ status: 200, description: 'Tipo eliminado (desactivado)' })
  @ApiResponse({ status: 404, description: 'Tipo no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'El tipo tiene subtipos o está en uso',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tiposService.remove(id);
  }

  @Delete(':id/hard')
  @RequirePermission('catalogos', 'delete')
  @ApiOperation({ summary: 'Eliminar permanentemente un tipo' })
  @ApiResponse({ status: 200, description: 'Tipo eliminado permanentemente' })
  @ApiResponse({ status: 404, description: 'Tipo no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'El tipo tiene subtipos o está en uso',
  })
  hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.tiposService.hardDelete(id);
  }
}
