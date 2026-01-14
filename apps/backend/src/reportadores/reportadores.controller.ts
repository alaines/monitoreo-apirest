import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportadoresService } from './reportadores.service';
import { CreateReportadorDto, UpdateReportadorDto, ReportadorResponseDto } from './reportadores.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('reportadores')
@ApiBearerAuth()
@Controller('reportadores')
@UseGuards(JwtAuthGuard)
export class ReportadoresController {
  constructor(private readonly reportadoresService: ReportadoresService) {}

  @Get()
  // No requiere permiso específico - usado en filtros
  @ApiOperation({ summary: 'Listar todos los reportadores' })
  async findAll(): Promise<ReportadorResponseDto[]> {
    return this.reportadoresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un reportador por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ReportadorResponseDto> {
    return this.reportadoresService.findOne(id);
  }

  @Post()
  @RequirePermission('reportadores_mant', 'create')
  @ApiOperation({ summary: 'Crear un nuevo reportador' })
  async create(@Body() createReportadorDto: CreateReportadorDto): Promise<ReportadorResponseDto> {
    return this.reportadoresService.create(createReportadorDto);
  }

  @Patch(':id')
  @RequirePermission('reportadores_mant', 'edit')
  @ApiOperation({ summary: 'Actualizar un reportador' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReportadorDto: UpdateReportadorDto,
  ): Promise<ReportadorResponseDto> {
    return this.reportadoresService.update(id, updateReportadorDto);
  }

  @Delete(':id')
  @RequirePermission('reportadores_mant', 'delete')
  @ApiOperation({ summary: 'Desactivar un reportador (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ReportadorResponseDto> {
    return this.reportadoresService.remove(id);
  }
}
