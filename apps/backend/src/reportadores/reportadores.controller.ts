import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportadoresService } from './reportadores.service';
import { CreateReportadorDto, UpdateReportadorDto, ReportadorResponseDto } from './reportadores.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('reportadores')
@ApiBearerAuth()
@Controller('reportadores')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportadoresController {
  constructor(private readonly reportadoresService: ReportadoresService) {}

  @Get()
  @RequirePermission('reportadores', 'view')
  @ApiOperation({ summary: 'Listar todos los reportadores' })
  async findAll(): Promise<ReportadorResponseDto[]> {
    return this.reportadoresService.findAll();
  }

  @Get(':id')
  @RequirePermission('reportadores', 'view')
  @ApiOperation({ summary: 'Obtener un reportador por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ReportadorResponseDto> {
    return this.reportadoresService.findOne(id);
  }

  @Post()
  @RequirePermission('reportadores', 'create')
  @ApiOperation({ summary: 'Crear un nuevo reportador' })
  async create(@Body() createReportadorDto: CreateReportadorDto): Promise<ReportadorResponseDto> {
    return this.reportadoresService.create(createReportadorDto);
  }

  @Patch(':id')
  @RequirePermission('reportadores', 'edit')
  @ApiOperation({ summary: 'Actualizar un reportador' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReportadorDto: UpdateReportadorDto,
  ): Promise<ReportadorResponseDto> {
    return this.reportadoresService.update(id, updateReportadorDto);
  }

  @Delete(':id')
  @RequirePermission('reportadores', 'delete')
  @ApiOperation({ summary: 'Desactivar un reportador (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ReportadorResponseDto> {
    return this.reportadoresService.remove(id);
  }
}
