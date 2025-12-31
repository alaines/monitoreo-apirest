import { IsOptional, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum PeriodoReporte {
  DIA = 'DIA',
  MES = 'MES',
  ANIO = 'ANIO',
  PERSONALIZADO = 'PERSONALIZADO'
}

export class ReporteIncidenciasDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsEnum(PeriodoReporte)
  periodo?: PeriodoReporte;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mes?: number; // 1-12

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  anio?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tipoIncidencia?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  estadoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  administradorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cruceId?: number;
}
