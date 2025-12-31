import { IsString, IsNumber, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePerifericoDto {
  @ApiProperty({ description: 'Tipo de periférico', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  tipoPeriferico: number;

  @ApiPropertyOptional({ description: 'Fabricante', example: 'SIEMENS' })
  @IsOptional()
  @IsString()
  fabricante?: string;

  @ApiPropertyOptional({ description: 'Modelo', example: 'X200' })
  @IsOptional()
  @IsString()
  modelo?: string;

  @ApiPropertyOptional({ description: 'Dirección IP', example: '192.168.1.100' })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({ description: 'Número de serie' })
  @IsOptional()
  @IsString()
  numeroSerie?: string;

  @ApiPropertyOptional({ description: 'Usuario de acceso' })
  @IsOptional()
  @IsString()
  usuario?: string;

  @ApiPropertyOptional({ description: 'Contraseña de acceso' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'En garantía', default: false })
  @IsOptional()
  @IsBoolean()
  enGarantia?: boolean;

  @ApiPropertyOptional({ description: 'Estado del periférico', example: 'OPERATIVO' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Usuario que registra' })
  @IsOptional()
  @IsString()
  usuario_registra?: string;
}
