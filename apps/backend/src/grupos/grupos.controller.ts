import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GruposService } from './grupos.service';
import { CreateGrupoDto, UpdateGrupoDto } from './dto/grupo.dto';

@ApiTags('grupos')
@ApiBearerAuth()
@Controller('grupos')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Get()
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
  @ApiOperation({ summary: 'Crear un nuevo grupo' })
  create(@Body() createGrupoDto: CreateGrupoDto) {
    return this.gruposService.create(createGrupoDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un grupo' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateGrupoDto: UpdateGrupoDto) {
    return this.gruposService.update(id, updateGrupoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un grupo (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gruposService.remove(id);
  }
}
