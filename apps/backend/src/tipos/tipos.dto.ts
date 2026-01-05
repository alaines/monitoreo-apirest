import { IsString, IsOptional, IsBoolean, IsInt, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTipoDto {
  @ApiProperty({ description: 'Nombre del tipo', example: 'Semáforo vehicular' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'ID del tipo padre', example: 1 })
  @IsOptional()
  @IsInt()
  parent_id?: number;

  @ApiPropertyOptional({ description: 'Estado del tipo', default: true })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class UpdateTipoDto {
  @ApiPropertyOptional({ description: 'Nombre del tipo' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'ID del tipo padre' })
  @IsOptional()
  @IsInt()
  parent_id?: number;

  @ApiPropertyOptional({ description: 'Estado del tipo' })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class TipoResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  parent_id!: number | null;

  @ApiProperty()
  estado!: boolean;

  @ApiProperty({ required: false })
  lft!: number | null;

  @ApiProperty({ required: false })
  rght!: number | null;

  @ApiPropertyOptional({ type: [TipoResponseDto] })
  children?: TipoResponseDto[];

  @ApiPropertyOptional()
  parent?: TipoResponseDto;
}
