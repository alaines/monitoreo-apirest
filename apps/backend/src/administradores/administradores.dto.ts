import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsInt, IsEmail, MaxLength } from 'class-validator';

export class CreateAdministradorDto {
  @ApiProperty({ description: 'Nombre del administrador' })
  @IsString()
  @MaxLength(255)
  nombre!: string;

  @ApiPropertyOptional({ description: 'Nombre del responsable' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  responsable?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsOptional()
  @IsInt()
  telefono?: number;

  @ApiPropertyOptional({ description: 'Email de contacto' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Estado del administrador', default: true })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class UpdateAdministradorDto extends PartialType(CreateAdministradorDto) {}

export class AdministradorResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() nombre!: string;
  @ApiProperty({ required: false }) responsable!: string | null;
  @ApiProperty({ required: false }) telefono!: number | null;
  @ApiProperty({ required: false }) email!: string | null;
  @ApiProperty() estado!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
