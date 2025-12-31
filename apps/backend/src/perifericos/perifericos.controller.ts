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
import { PerifericosService } from './perifericos.service';
import { CreatePerifericoDto } from './dto/create-periferico.dto';
import { UpdatePerifericoDto } from './dto/update-periferico.dto';
import { QueryPerifericosDto } from './dto/query-perifericos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('perifericos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('perifericos')
export class PerifericosController {
  constructor(private readonly perifericosService: PerifericosService) {}

  @Post()
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Crear un nuevo periférico' })
  @ApiResponse({ status: 201, description: 'Periférico creado exitosamente' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  create(@Body() createPerifericoDto: CreatePerifericoDto) {
    return this.perifericosService.create(createPerifericoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de periféricos con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de periféricos obtenida exitosamente' })
  findAll(@Query() query: QueryPerifericosDto) {
    return this.perifericosService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un periférico' })
  @ApiResponse({ status: 200, description: 'Periférico encontrado' })
  @ApiResponse({ status: 404, description: 'Periférico no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.perifericosService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Actualizar un periférico' })
  @ApiResponse({ status: 200, description: 'Periférico actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Periférico no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePerifericoDto: UpdatePerifericoDto) {
    return this.perifericosService.update(id, updatePerifericoDto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Eliminar un periférico' })
  @ApiResponse({ status: 200, description: 'Periférico eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Periférico no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.perifericosService.remove(id);
  }
}
