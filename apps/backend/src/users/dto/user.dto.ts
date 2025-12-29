import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsInt,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
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
  personaId?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  estado?: boolean;
}

export class UpdateUserDto {
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
  personaId?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  estado?: boolean;
}

export class UserResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  usuario!: string;

  @ApiProperty()
  grupoId!: number;

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
  persona?: {
    id: number;
    nombres: string;
    ape_pat: string;
    ape_mat: string;
  };
}
