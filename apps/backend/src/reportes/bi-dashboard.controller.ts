import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BiDashboardService } from './bi-dashboard.service';
import { QueryBiDashboardDto } from './dto/bi-dashboard.dto';

@ApiTags('reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reportes/bi-dashboard')
export class BiDashboardController {
  constructor(private readonly biDashboardService: BiDashboardService) {}

  @Get('filters')
  @ApiOperation({ summary: 'Obtener filtros y opciones disponibles para el Dashboard BI' })
  @ApiResponse({ status: 200, description: 'Catálogos de filtros' })
  getFilterOptions() {
    return this.biDashboardService.getAvailableFilterOptions();
  }

  @Get('data')
  @ApiOperation({ summary: 'Obtener paquete completo de datos y métricas para el Dashboard BI' })
  @ApiResponse({ status: 200, description: 'Datos integrados del dashboard' })
  getFullData(@Query() query: QueryBiDashboardDto) {
    return this.biDashboardService.getFullDashboardData(query);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Obtener KPIs ejecutivos del Dashboard BI' })
  @ApiResponse({ status: 200, description: 'KPIs agregados' })
  getKpis(@Query() query: QueryBiDashboardDto) {
    return this.biDashboardService.getExecutiveKpis(query);
  }

  @Get('monthly-trend')
  @ApiOperation({ summary: 'Obtener tendencia mensual de incidencias y atenciones' })
  @ApiResponse({ status: 200, description: 'Datos mensuales' })
  getMonthlyTrend(@Query() query: QueryBiDashboardDto) {
    return this.biDashboardService.getMonthlyTrend(query);
  }

  @Get('causes')
  @ApiOperation({ summary: 'Obtener top tipos de causas de incidencias' })
  @ApiResponse({ status: 200, description: 'Top causas' })
  getCauses(@Query() query: QueryBiDashboardDto) {
    return this.biDashboardService.getCausesBreakdown(query);
  }

  @Get('districts')
  @ApiOperation({ summary: 'Obtener análisis por distritos de Lima Metropolitana' })
  @ApiResponse({ status: 200, description: 'Datos por distrito' })
  getDistricts(@Query() query: QueryBiDashboardDto) {
    return this.biDashboardService.getDistrictsAnalytics(query);
  }

  @Get('teams')
  @ApiOperation({ summary: 'Obtener distribución de carga por equipo de trabajo' })
  @ApiResponse({ status: 200, description: 'Datos por equipo' })
  getTeams(@Query() query: QueryBiDashboardDto) {
    return this.biDashboardService.getTeamsWorkload(query);
  }
}
