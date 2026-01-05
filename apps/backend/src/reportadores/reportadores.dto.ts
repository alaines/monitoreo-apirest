import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateReportadorDto {
  @ApiProperty({ description: 'Nombre del reportador' })
  @IsString()
  @MaxLength(255)
  nombre!: string;

  @ApiPropertyOptional({ description: 'Estado del reportador', default: true })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class UpdateReportadorDto extends PartialType(CreateReportadorDto) {}

export class ReportadorResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() nombre!: string;
  @ApiProperty({ required: false }) estado!: boolean | null;
  @ApiProperty({ required: false }) createdAt!: Date | null;
  @ApiProperty({ required: false }) updatedAt!: Date | null;
}
