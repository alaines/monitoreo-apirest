import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateResponsableDto {
  @ApiProperty({ description: 'Nombre del responsable' })
  @IsString()
  @MaxLength(30)
  nombre!: string;

  @ApiPropertyOptional({ description: 'ID del equipo al que pertenece' })
  @IsOptional()
  @IsInt()
  equipoId?: number;

  @ApiPropertyOptional({ description: 'Estado del responsable', default: true })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class UpdateResponsableDto extends PartialType(CreateResponsableDto) {}

export class ResponsableResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ required: false }) nombre!: string | null;
  @ApiProperty({ required: false }) equipoId!: number | null;
  @ApiProperty() estado!: boolean;
}
