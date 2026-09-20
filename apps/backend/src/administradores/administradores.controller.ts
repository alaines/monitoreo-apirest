import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AdministradoresService } from './administradores.service';
import { CreateAdministradorDto, UpdateAdministradorDto, AdministradorResponseDto } from './administradores.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('administradores')
@ApiBearerAuth()
@Controller('administradores')
@UseGuards(JwtAuthGuard)
export class AdministradoresController {
  constructor(private readonly administradoresService: AdministradoresService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener todos los administradores' })
  @ApiResponse({ status: 200, type: [AdministradorResponseDto] })
  findAll() {
    return this.administradoresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un administrador por ID' })
  @ApiResponse({ status: 200, type: AdministradorResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.administradoresService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo administrador' })
  @ApiResponse({ status: 201, type: AdministradorResponseDto })
  create(@Body() createDto: CreateAdministradorDto) {
    return this.administradoresService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un administrador' })
  @ApiResponse({ status: 200, type: AdministradorResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAdministradorDto,
  ) {
    return this.administradoresService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar un administrador' })
  @ApiResponse({ status: 200, type: AdministradorResponseDto })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.administradoresService.remove(id);
  }
}
