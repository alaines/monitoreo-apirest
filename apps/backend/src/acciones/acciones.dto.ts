import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNumber, IsOptional, MaxLength } from 'class-validator';

export class CreateAccionDto {
  @ApiProperty({ description: 'Nombre de la acción', example: 'Ver' })
  @IsString()
  @MaxLength(50)
  nombre!: string;

  @ApiProperty({ description: 'Código único de la acción', example: 'view' })
  @IsString()
  @MaxLength(20)
  codigo!: string;

  @ApiProperty({ description: 'Descripción de la acción', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  @ApiProperty({ description: 'Orden de visualización', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  orden?: number;

  @ApiProperty({ description: 'Estado activo/inactivo', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class UpdateAccionDto {
  @ApiProperty({ description: 'Nombre de la acción', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nombre?: string;

  @ApiProperty({ description: 'Descripción de la acción', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;

  @ApiProperty({ description: 'Orden de visualización', required: false })
  @IsOptional()
  @IsNumber()
  orden?: number;

  @ApiProperty({ description: 'Estado activo/inactivo', required: false })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
