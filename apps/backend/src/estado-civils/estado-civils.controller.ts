import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EstadoCivilsService } from './estado-civils.service';

@ApiTags('estado-civils')
@Controller('estado-civils')
export class EstadoCivilsController {
  constructor(private readonly estadoCivilsService: EstadoCivilsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los estados civiles activos' })
  @ApiResponse({ status: 200, description: 'Lista de estados civiles' })
  findAll() {
    return this.estadoCivilsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un estado civil por ID' })
  @ApiResponse({ status: 200, description: 'Estado civil encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.estadoCivilsService.findOne(id);
  }
}
