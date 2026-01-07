import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TipoDocsService } from './tipo-docs.service';

@ApiTags('tipo-docs')
@Controller('tipo-docs')
export class TipoDocsController {
  constructor(private readonly tipoDocsService: TipoDocsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tipos de documento activos' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de documento' })
  findAll() {
    return this.tipoDocsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de documento por ID' })
  @ApiResponse({ status: 200, description: 'Tipo de documento encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoDocsService.findOne(id);
  }
}
