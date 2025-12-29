import { PartialType } from '@nestjs/swagger';
import { CreateIncidentDto } from './create-incident.dto';
import { IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @ApiPropertyOptional({ description: 'ID del estado' })
  @IsInt()
  @IsOptional()
  estadoId?: number;

  @ApiPropertyOptional({ description: 'ID del equipo asignado' })
  @IsInt()
  @IsOptional()
  equipoId?: number;
}
