import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateEjeDto {
  @ApiProperty({ description: 'Nombre de la vía' })
  @IsString()
  @MaxLength(255)
  nombreVia!: string;

  @ApiPropertyOptional({ description: 'Tipo de vía (ID del tipo)' })
  @IsOptional()
  @IsInt()
  tipoVia?: number;

  @ApiPropertyOptional({ description: 'Número de carriles' })
  @IsOptional()
  @IsInt()
  nroCarriles?: number;

  @ApiPropertyOptional({ description: '¿Tiene ciclovía?', default: false })
  @IsOptional()
  @IsBoolean()
  ciclovia?: boolean;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class UpdateEjeDto extends PartialType(CreateEjeDto) {}

export class EjeResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() nombreVia!: string;
  @ApiProperty({ required: false }) tipoVia!: number | null;
  @ApiProperty({ required: false }) nroCarriles!: number | null;
  @ApiProperty({ required: false }) ciclovia!: boolean | null;
  @ApiProperty({ required: false }) observaciones!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
