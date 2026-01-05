import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PermisosService } from './permisos.service';
import {
  CreatePermisoDto,
  BulkCreatePermisosDto,
  BulkDeletePermisosDto,
} from './permisos.dto';

@ApiTags('permisos')
@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Get('grupo/:grupoId')
  @ApiOperation({ summary: 'Obtener todos los permisos de un grupo' })
  @ApiResponse({ status: 200, description: 'Permisos del grupo' })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado' })
  getPermisosByGrupo(@Param('grupoId', ParseIntPipe) grupoId: number) {
    return this.permisosService.getPermisosByGrupo(grupoId);
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Obtener todos los permisos de un usuario' })
  @ApiResponse({ status: 200, description: 'Permisos del usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  getPermisosByUsuario(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.permisosService.getPermisosByUsuario(usuarioId);
  }

  @Get('verificar')
  @ApiOperation({ summary: 'Verificar si un usuario tiene un permiso específico' })
  @ApiQuery({ name: 'usuarioId', type: Number })
  @ApiQuery({ name: 'menuCodigo', type: String, example: 'tickets' })
  @ApiQuery({ name: 'accionCodigo', type: String, example: 'view' })
  @ApiResponse({ status: 200, description: 'Resultado de la verificación' })
  async verificarPermiso(
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
    @Query('menuCodigo') menuCodigo: string,
    @Query('accionCodigo') accionCodigo: string,
  ) {
    const tienePermiso = await this.permisosService.verificarPermiso(
      usuarioId,
      menuCodigo,
      accionCodigo,
    );

    return {
      tienePermiso,
      usuario: usuarioId,
      menu: menuCodigo,
      accion: accionCodigo,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Crear un permiso individual' })
  @ApiResponse({ status: 201, description: 'Permiso creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El permiso ya existe' })
  createPermiso(@Body() createPermisoDto: CreatePermisoDto) {
    return this.permisosService.createPermiso(createPermisoDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Crear/actualizar múltiples permisos de un menú' })
  @ApiResponse({ status: 201, description: 'Permisos creados exitosamente' })
  bulkCreatePermisos(@Body() bulkCreatePermisosDto: BulkCreatePermisosDto) {
    return this.permisosService.bulkCreatePermisos(bulkCreatePermisosDto);
  }

  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar múltiples permisos' })
  @ApiResponse({ status: 200, description: 'Permisos eliminados exitosamente' })
  bulkDeletePermisos(@Body() bulkDeletePermisosDto: BulkDeletePermisosDto) {
    return this.permisosService.bulkDeletePermisos(bulkDeletePermisosDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un permiso específico' })
  @ApiResponse({ status: 200, description: 'Permiso eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
  deletePermiso(@Param('id', ParseIntPipe) id: number) {
    return this.permisosService.deletePermiso(id);
  }

  @Post('copiar')
  @ApiOperation({ summary: 'Copiar permisos de un grupo a otro' })
  @ApiQuery({ name: 'origen', type: Number, description: 'ID del grupo origen' })
  @ApiQuery({ name: 'destino', type: Number, description: 'ID del grupo destino' })
  @ApiResponse({ status: 200, description: 'Permisos copiados exitosamente' })
  copiarPermisos(
    @Query('origen', ParseIntPipe) grupoOrigenId: number,
    @Query('destino', ParseIntPipe) grupoDestinoId: number,
  ) {
    return this.permisosService.copiarPermisos(grupoOrigenId, grupoDestinoId);
  }
}
