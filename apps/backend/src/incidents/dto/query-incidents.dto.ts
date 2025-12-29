import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryIncidentsDto {
  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Cantidad de resultados por página', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'ID del estado' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  estadoId?: number;

  @ApiPropertyOptional({ description: 'ID de la incidencia (tipo)' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  incidenciaId?: number;

  @ApiPropertyOptional({ description: 'ID del equipo' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  equipoId?: number;

  @ApiPropertyOptional({ description: 'ID del cruce/intersección' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  cruceId?: number;

  @ApiPropertyOptional({ description: 'Búsqueda en descripción' })
  @IsString()
  @IsOptional()
  search?: string;
}
