import { IsNotEmpty, IsString, IsInt, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIncidentDto {
  @ApiProperty({ description: 'ID de la incidencia (tipo)' })
  @IsInt()
  @IsNotEmpty()
  incidenciaId!: number;

  @ApiPropertyOptional({ description: 'ID de la prioridad' })
  @IsInt()
  @IsOptional()
  prioridadId?: number;

  @ApiProperty({ description: 'ID del cruce/semáforo (obligatorio)' })
  @IsInt()
  @IsNotEmpty()
  cruceId!: number;

  @ApiProperty({ description: 'Descripción de la incidencia' })
  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @ApiPropertyOptional({ description: 'Nombre del reportador' })
  @IsString()
  @IsOptional()
  reportadorNombres?: string;

  @ApiPropertyOptional({ description: 'Dato de contacto del reportador' })
  @IsString()
  @IsOptional()
  reportadorDatoContacto?: string;

  @ApiPropertyOptional({ description: 'ID del reportador registrado' })
  @IsInt()
  @IsOptional()
  reportadorId?: number;
}
