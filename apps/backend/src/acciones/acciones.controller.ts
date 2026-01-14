import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccionesService } from './acciones.service';
import { CreateAccionDto, UpdateAccionDto } from './acciones.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('acciones')
@ApiBearerAuth()
@Controller('acciones')
@UseGuards(JwtAuthGuard)
export class AccionesController {
  constructor(private readonly accionesService: AccionesService) {}

  @Get()
  // No requiere permiso específico - usado en gestión de permisos
  @ApiOperation({ summary: 'Obtener todas las acciones activas' })
  @ApiResponse({ status: 200, description: 'Lista de acciones' })
  findAll() {
    return this.accionesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una acción por ID' })
  @ApiResponse({ status: 200, description: 'Acción encontrada' })
  @ApiResponse({ status: 404, description: 'Acción no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.accionesService.findOne(id);
  }

  @Get('codigo/:codigo')
  @ApiOperation({ summary: 'Obtener una acción por código' })
  @ApiResponse({ status: 200, description: 'Acción encontrada' })
  @ApiResponse({ status: 404, description: 'Acción no encontrada' })
  findByCodigo(@Param('codigo') codigo: string) {
    return this.accionesService.findByCodigo(codigo);
  }

  @Post()
  @RequirePermission('grupos', 'create')
  @ApiOperation({ summary: 'Crear una nueva acción' })
  @ApiResponse({ status: 201, description: 'Acción creada exitosamente' })
  @ApiResponse({ status: 409, description: 'El código ya existe' })
  create(@Body() createAccionDto: CreateAccionDto) {
    return this.accionesService.create(createAccionDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una acción' })
  @ApiResponse({ status: 200, description: 'Acción actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Acción no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccionDto: UpdateAccionDto,
  ) {
    return this.accionesService.update(id, updateAccionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una acción' })
  @ApiResponse({ status: 204, description: 'Acción eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Acción no encontrada' })
  @ApiResponse({ status: 409, description: 'Acción está siendo usada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.accionesService.remove(id);
  }

  @Delete(':id/soft')
  @ApiOperation({ summary: 'Desactivar una acción (borrado lógico)' })
  @ApiResponse({ status: 200, description: 'Acción desactivada exitosamente' })
  @ApiResponse({ status: 404, description: 'Acción no encontrada' })
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.accionesService.softDelete(id);
  }
}
