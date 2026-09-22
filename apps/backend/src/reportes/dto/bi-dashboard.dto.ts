import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryBiDashboardDto {
  @ApiPropertyOptional({ description: 'Año a filtrar', default: 2026 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  anho?: number;

  @ApiPropertyOptional({ description: 'Mes a filtrar (1-12, opcional)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  mes?: number;

  @ApiPropertyOptional({ description: 'Distrito / Ubigeo' })
  @IsString()
  @IsOptional()
  distrito?: string;

  @ApiPropertyOptional({ description: 'ID del Administrador del cruce' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  administradorId?: number;

  @ApiPropertyOptional({ description: 'ID del Equipo de Trabajo' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  equipoId?: number;

  @ApiPropertyOptional({ description: 'ID de la Prioridad' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  prioridadId?: number;

  @ApiPropertyOptional({ description: 'Tipo de trabajo / característica (I = Incidencia, T = Tareas/Mantenimiento)' })
  @IsString()
  @IsOptional()
  caracteristica?: string;
}
