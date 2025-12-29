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

  @ApiPropertyOptional({ description: 'ID del cruce/semáforo' })
  @IsInt()
  @IsOptional()
  cruceId?: number;

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

  @ApiProperty({ description: 'Latitud de la ubicación', example: -12.046374 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsNotEmpty()
  latitude!: number;

  @ApiProperty({ description: 'Longitud de la ubicación', example: -77.042793 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsNotEmpty()
  longitude!: number;
}
