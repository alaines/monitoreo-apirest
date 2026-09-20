import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EjesService } from './ejes.service';
import { CreateEjeDto, UpdateEjeDto, EjeResponseDto } from './ejes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('ejes')
@ApiBearerAuth()
@Controller('ejes')
@UseGuards(JwtAuthGuard)
export class EjesController {
  constructor(private readonly ejesService: EjesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener lista de ejes viales' })
  @ApiResponse({ status: 200, description: 'Lista de ejes obtenida exitosamente', type: [EjeResponseDto] })
  findAll() {
    return this.ejesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un eje por ID' })
  @ApiResponse({ status: 200, description: 'Eje encontrado', type: EjeResponseDto })
  @ApiResponse({ status: 404, description: 'Eje no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ejesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo eje vial' })
  @ApiResponse({ status: 201, type: EjeResponseDto })
  create(@Body() createDto: CreateEjeDto) {
    return this.ejesService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un eje vial' })
  @ApiResponse({ status: 200, type: EjeResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEjeDto,
  ) {
    return this.ejesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un eje vial' })
  @ApiResponse({ status: 200 })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ejesService.remove(id);
  }
}
