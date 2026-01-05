import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateIncidenciaDto {
  @ApiProperty({ description: 'Tipo de incidencia' })
  @IsString()
  @MaxLength(255)
  tipo!: string;

  @ApiPropertyOptional({ description: 'ID del tipo padre' })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @ApiPropertyOptional({ description: 'ID de la prioridad' })
  @IsOptional()
  @IsInt()
  prioridadId?: number;

  @ApiPropertyOptional({ description: 'Característica de la incidencia' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  caracteristica?: string;

  @ApiPropertyOptional({ description: 'Estado de la incidencia', default: true })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class UpdateIncidenciaDto extends PartialType(CreateIncidenciaDto) {}

export class IncidenciaResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ required: false }) tipo!: string | null;
  @ApiProperty({ required: false }) parentId!: number | null;
  @ApiProperty({ required: false }) prioridadId!: number | null;
  @ApiProperty({ required: false }) caracteristica!: string | null;
  @ApiProperty() estado!: boolean;
}
