import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsInt,
  IsBoolean,
  IsOptional,
  IsDate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateUserDto {
  // Campos de usuario
  @ApiProperty({ example: 'jdoe' })
  @IsString()
  @IsNotEmpty()
  usuario!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  grupoId!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  areaId?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  estado?: boolean;

  // Campos de persona
  @ApiProperty({ example: 1, description: 'ID del tipo de documento (1=DNI, 2=RUC, 3=Carnet Extranjería)' })
  @IsInt()
  @IsNotEmpty()
  tipoDocId!: number;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  nroDoc!: string;

  @ApiProperty({ example: 'Juan Carlos' })
  @IsString()
  @IsNotEmpty()
  nombres!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  apellidoP!: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  @IsNotEmpty()
  apellidoM!: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaNacimiento?: Date;

  @ApiPropertyOptional({ example: 'M' })
  @IsString()
  @IsOptional()
  genero?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  estadoCivilId?: number;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '999888777' })
  @IsString()
  @IsOptional()
  telefono?: string;
}

export class UpdateUserDto {
  // Campos de usuario
  @ApiPropertyOptional({ example: 'jdoe' })
  @IsString()
  @IsOptional()
  usuario?: string;

  @ApiPropertyOptional({ example: 'newpassword123' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  grupoId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  areaId?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  estado?: boolean;

  // Campos de persona
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  tipoDocId?: number;

  @ApiPropertyOptional({ example: '12345678' })
  @IsString()
  @IsOptional()
  nroDoc?: string;

  @ApiPropertyOptional({ example: 'Juan Carlos' })
  @IsString()
  @IsOptional()
  nombres?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsString()
  @IsOptional()
  apellidoP?: string;

  @ApiPropertyOptional({ example: 'García' })
  @IsString()
  @IsOptional()
  apellidoM?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaNacimiento?: Date;

  @ApiPropertyOptional({ example: 'M' })
  @IsString()
  @IsOptional()
  genero?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  estadoCivilId?: number;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '999888777' })
  @IsString()
  @IsOptional()
  telefono?: string;
}

export class UserResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  usuario!: string;

  @ApiProperty()
  grupoId!: number;

  @ApiPropertyOptional()
  areaId?: number;

  @ApiPropertyOptional()
  personaId?: number;

  @ApiProperty()
  estado!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional()
  grupo?: {
    id: number;
    nombre: string;
  };

  @ApiPropertyOptional()
  area?: {
    id: number;
    nombre: string;
  };

  @ApiPropertyOptional()
  persona?: {
    id: number;
    tipoDocId?: number;
    numDoc?: string;
    nombres?: string;
    ape_pat?: string;
    ape_mat?: string;
    genero?: string;
    fecnac?: Date;
    estadoCivilId?: number;
    email?: string;
    movil1?: string;
  };
}
