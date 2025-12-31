import {
  Controller,
  Get,
  Query,
  Res,
  StreamableFile,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportesService } from './reportes.service';
import { ReporteIncidenciasDto } from './dto/reporte-incidencias.dto';

@Controller('reportes')
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

  @Get('incidencias/pdf')
  @Header('Content-Type', 'application/pdf')
  async exportarPDF(
    @Query() filtros: ReporteIncidenciasDto,
    @Res() res: Response,
  ) {
    const buffer = await this.reportesService.generarPDF(filtros);
    
    const filename = `reporte_incidencias_${new Date().toISOString().split('T')[0]}.pdf`;
    res.set({
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    
    res.send(buffer);
  }
}
