import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CrucesService } from './cruces.service';
import { CreateCruceDto } from './dto/create-cruce.dto';
import { UpdateCruceDto } from './dto/update-cruce.dto';
import { QueryCrucesDto } from './dto/query-cruces.dto';
import { AddPerifericoDto } from './dto/add-periferico.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('cruces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cruces')
export class CrucesController {
  constructor(private readonly crucesService: CrucesService) {}

  @Post()
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Crear un nuevo cruce' })
  @ApiResponse({ status: 201, description: 'Cruce creado exitosamente' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  create(@Body() createCruceDto: CreateCruceDto, @CurrentUser() user: any) {
    return this.crucesService.create(createCruceDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de cruces con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de cruces obtenida exitosamente' })
  findAll(@Query() query: QueryCrucesDto) {
    return this.crucesService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar cruces para autocomplete' })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  search(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.crucesService.search(query, limit ? parseInt(limit.toString()) : 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un cruce' })
  @ApiResponse({ status: 200, description: 'Cruce encontrado' })
  @ApiResponse({ status: 404, description: 'Cruce no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.crucesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Actualizar un cruce' })
  @ApiResponse({ status: 200, description: 'Cruce actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Cruce no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCruceDto: UpdateCruceDto) {
    return this.crucesService.update(id, updateCruceDto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Eliminar (desactivar) un cruce' })
  @ApiResponse({ status: 200, description: 'Cruce desactivado exitosamente' })
  @ApiResponse({ status: 404, description: 'Cruce no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.crucesService.remove(id);
  }

  // Endpoints de periféricos
  @Get(':id/perifericos')
  @ApiOperation({ summary: 'Obtener periféricos de un cruce' })
  @ApiResponse({ status: 200, description: 'Lista de periféricos del cruce' })
  getPerifericos(@Param('id', ParseIntPipe) id: number) {
    return this.crucesService.getPerifericos(id);
  }

  @Post(':id/perifericos')
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Agregar un periférico a un cruce' })
  @ApiResponse({ status: 201, description: 'Periférico agregado exitosamente' })
  addPeriferico(
    @Param('id', ParseIntPipe) id: number,
    @Body() addPerifericoDto: AddPerifericoDto,
  ) {
    return this.crucesService.addPeriferico(id, addPerifericoDto.perifericoId);
  }

  @Delete(':id/perifericos/:perifericoId')
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Remover un periférico de un cruce' })
  @ApiResponse({ status: 200, description: 'Periférico removido exitosamente' })
  removePeriferico(
    @Param('id', ParseIntPipe) id: number,
    @Param('perifericoId', ParseIntPipe) perifericoId: number,
  ) {
    return this.crucesService.removePeriferico(id, perifericoId);
  }
}
