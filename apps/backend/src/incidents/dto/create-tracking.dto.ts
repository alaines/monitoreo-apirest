import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTrackingDto {
  @ApiPropertyOptional({ description: 'ID del equipo asignado' })
  @IsOptional()
  @IsInt()
  equipoId?: number;

  @ApiPropertyOptional({ description: 'ID del responsable' })
  @IsOptional()
  @IsInt()
  responsableId?: number;

  @ApiProperty({ description: 'Reporte o comentario del seguimiento' })
  @IsString()
  reporte!: string;

  @ApiPropertyOptional({ description: 'ID del nuevo estado' })
  @IsOptional()
  @IsInt()
  estadoId?: number;
}
