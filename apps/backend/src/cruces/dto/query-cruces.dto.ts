import { IsOptional, IsString, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCrucesDto {
  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Elementos por página', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Buscar por nombre' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por código' })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  estado?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar por ubigeo' })
  @IsOptional()
  @IsString()
  ubigeoId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por proyecto' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  proyectoId?: number;

  @ApiPropertyOptional({ description: 'Campo para ordenar', default: 'id' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'id';

  @ApiPropertyOptional({ description: 'Dirección de ordenamiento', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
