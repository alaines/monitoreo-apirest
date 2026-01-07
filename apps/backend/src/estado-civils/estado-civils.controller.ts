import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EstadoCivilsService } from './estado-civils.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('estado-civils')
@Controller('estado-civils')
export class EstadoCivilsController {
  constructor(private readonly estadoCivilsService: EstadoCivilsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener todos los estados civiles activos' })
  @ApiResponse({ status: 200, description: 'Lista de estados civiles' })
  findAll() {
    return this.estadoCivilsService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un estado civil por ID' })
  @ApiResponse({ status: 200, description: 'Estado civil encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.estadoCivilsService.findOne(id);
  }
}
