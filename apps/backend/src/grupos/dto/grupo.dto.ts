import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateGrupoDto {
  @ApiProperty({ description: 'Nombre del grupo', example: 'Administradores' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ description: 'Descripción del grupo', example: 'Grupo de administradores del sistema' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Estado del grupo', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  estado?: boolean;
}

export class UpdateGrupoDto extends PartialType(CreateGrupoDto) {}
