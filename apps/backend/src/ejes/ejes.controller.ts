import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EjesService } from './ejes.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('ejes')
@Controller('ejes')
export class EjesController {
  constructor(private readonly ejesService: EjesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener lista de ejes viales' })
  @ApiResponse({ status: 200, description: 'Lista de ejes obtenida exitosamente' })
  findAll() {
    return this.ejesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un eje por ID' })
  @ApiResponse({ status: 200, description: 'Eje encontrado' })
  @ApiResponse({ status: 404, description: 'Eje no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ejesService.findOne(id);
  }
}
