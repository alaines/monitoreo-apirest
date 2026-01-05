import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateProyectoDto {
  @ApiPropertyOptional({ description: 'Siglas del proyecto' })
  @IsOptional()
  @IsString()
  @MaxLength(6)
  siglas?: string;

  @ApiPropertyOptional({ description: 'Nombre del proyecto' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Etapa del proyecto' })
  @IsOptional()
  @IsString()
  etapa?: string;

  @ApiPropertyOptional({ description: 'Empresa que ejecutó el proyecto' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ejecutado_x_empresa?: string;

  @ApiPropertyOptional({ description: 'Año del proyecto' })
  @IsOptional()
  @IsInt()
  ano_proyecto?: number;

  @ApiPropertyOptional({ description: 'Red asociada' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  red?: string;

  @ApiPropertyOptional({ description: 'Estado del proyecto', default: true })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class UpdateProyectoDto extends PartialType(CreateProyectoDto) {}

export class ProyectoResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ required: false }) siglas!: string | null;
  @ApiProperty({ required: false }) nombre!: string | null;
  @ApiProperty({ required: false }) etapa!: string | null;
  @ApiProperty({ required: false }) ejecutado_x_empresa!: string | null;
  @ApiProperty({ required: false }) ano_proyecto!: number | null;
  @ApiProperty({ required: false }) red!: string | null;
  @ApiProperty() estado!: boolean;
  @ApiProperty({ required: false }) createdAt!: Date | null;
  @ApiProperty({ required: false }) updatedAt!: Date | null;
}
