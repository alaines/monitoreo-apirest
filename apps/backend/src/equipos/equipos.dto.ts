import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateEquipoDto {
  @ApiProperty({ description: 'Nombre del equipo' })
  @IsString()
  @MaxLength(25)
  nombre!: string;

  @ApiPropertyOptional({ description: 'Estado del equipo', default: true })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class UpdateEquipoDto extends PartialType(CreateEquipoDto) {}

export class EquipoResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ required: false }) nombre!: string | null;
  @ApiProperty({ required: false }) estado!: boolean | null;
  @ApiProperty({ required: false }) createdAt!: Date | null;
  @ApiProperty({ required: false }) updatedAt!: Date | null;
}
