import {
  Controller,
  Get,
  Query,
  Res,
  Header,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportesService } from './reportes.service';
import { ReporteIncidenciasDto } from './dto/reporte-incidencias.dto';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('incidencias')
  async getReporteIncidencias(@Query() filtros: ReporteIncidenciasDto) {
    return this.reportesService.getReporteIncidencias(filtros);
  }

  @Get('incidencias/estadisticas')
  async getEstadisticas(@Query() filtros: ReporteIncidenciasDto) {
    return this.reportesService.getEstadisticas(filtros);
  }

  @Get('incidencias/excel')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportarExcel(
    @Query() filtros: ReporteIncidenciasDto,
    @Res() res: Response,
  ) {
    const buffer = await this.reportesService.generarExcel(filtros);
    
    const filename = `reporte_incidencias_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.set({
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    
    res.send(buffer);
  }

  // Endpoints para reporte gráfico consolidado
  @Get('grafico')
  async getReporteGrafico(@Query() filtros: ReporteIncidenciasDto) {
    return this.reportesService.getReporteGrafico(filtros);
  }

  @Get('grafico/excel')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportarExcelGrafico(
    @Query() filtros: ReporteIncidenciasDto,
    @Res() res: Response,
  ) {
    const buffer = await this.reportesService.generarExcelGrafico(filtros);
    
    const filename = `reporte_grafico_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.set({
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    
    res.send(buffer);
  }
}
