import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateAreaDto {
  @ApiProperty({ description: 'Nombre del área' })
  @IsString()
  @MaxLength(255)
  nombre!: string;

  @ApiPropertyOptional({ description: 'Código del área', example: 'SIS' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  codigo?: string;

  @ApiPropertyOptional({ description: 'Estado del área', default: true })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class UpdateAreaDto extends PartialType(CreateAreaDto) {}

export class AreaResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ required: false }) nombre!: string | null;
  @ApiProperty({ required: false }) codigo!: string | null;
  @ApiProperty({ required: false }) estado!: boolean | null;
  @ApiProperty({ required: false }) createdAt!: Date | null;
  @ApiProperty({ required: false }) updatedAt!: Date | null;
}
