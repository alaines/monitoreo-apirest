import { IsString, IsNumber, IsBoolean, IsOptional, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCruceDto {
  @ApiProperty({ description: 'Código de ubigeo', example: '150101' })
  @IsString()
  @IsNotEmpty()
  ubigeoId!: string;

  @ApiProperty({ description: 'Tipo de gestión', example: 1 })
  @IsNumber()
  tipoGestion!: number;

  @ApiPropertyOptional({ description: 'ID del administrador' })
  @IsOptional()
  @IsNumber()
  administradorId?: number;

  @ApiProperty({ description: 'ID del proyecto', example: 1 })
  @IsNumber()
  proyectoId!: number;

  @ApiProperty({ description: 'ID de vía 1', example: 1 })
  @IsNumber()
  via1!: number;

  @ApiProperty({ description: 'ID de vía 2', example: 2 })
  @IsNumber()
  via2!: number;

  @ApiPropertyOptional({ description: 'Tipo de comunicación' })
  @IsOptional()
  @IsNumber()
  tipoComunicacion?: number;

  @ApiPropertyOptional({ description: 'Estado activo/inactivo', default: true })
  @IsOptional()
  @IsBoolean()
  estado?: boolean;

  @ApiPropertyOptional({ description: 'Tipo de cruce' })
  @IsOptional()
  @IsNumber()
  tipoCruce?: number;

  @ApiPropertyOptional({ description: 'Tipo de estructura' })
  @IsOptional()
  @IsNumber()
  tipoEstructura?: number;

  @ApiPropertyOptional({ description: 'Ruta del plano PDF' })
  @IsOptional()
  @IsString()
  planoPdf?: string;

  @ApiPropertyOptional({ description: 'Ruta del plano DWG' })
  @IsOptional()
  @IsString()
  planoDwg?: string;

  @ApiPropertyOptional({ description: 'Tipo de operación' })
  @IsOptional()
  @IsString()
  tipoOperacion?: string;

  @ApiPropertyOptional({ description: 'Año de implementación', example: 2023 })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  anoImplementacion?: number;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ description: 'Nombre del cruce', example: 'AV. AREQUIPA CON AV. BENAVIDES' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ description: 'Latitud', example: -12.0464 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud!: number;

  @ApiProperty({ description: 'Longitud', example: -77.0428 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud!: number;

  @ApiPropertyOptional({ description: 'Código del cruce', example: 'C001' })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional({ description: 'Tipo de control' })
  @IsOptional()
  @IsNumber()
  tipoControl?: number;

  @ApiPropertyOptional({ description: 'Código anterior' })
  @IsOptional()
  @IsString()
  codigoAnterior?: string;

  @ApiPropertyOptional({ description: 'Usuario que registra' })
  @IsOptional()
  @IsString()
  usuarioRegistra?: string;

  @ApiPropertyOptional({ description: 'Empresa eléctrica' })
  @IsOptional()
  @IsString()
  electricoEmpresa?: string;

  @ApiPropertyOptional({ description: 'Suministro eléctrico' })
  @IsOptional()
  @IsString()
  electricoSuministro?: string;
}
