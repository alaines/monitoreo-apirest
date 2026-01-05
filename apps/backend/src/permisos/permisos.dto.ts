import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsArray, ArrayMinSize } from 'class-validator';

export class CreatePermisoDto {
  @ApiProperty({ description: 'ID del grupo (perfil)' })
  @IsInt()
  grupoId!: number;

  @ApiProperty({ description: 'ID del menú' })
  @IsInt()
  menuId!: number;

  @ApiProperty({ description: 'ID de la acción' })
  @IsInt()
  accionId!: number;
}

export class BulkCreatePermisosDto {
  @ApiProperty({ description: 'ID del grupo (perfil)' })
  @IsInt()
  grupoId!: number;

  @ApiProperty({ description: 'ID del menú' })
  @IsInt()
  menuId!: number;

  @ApiProperty({ description: 'IDs de las acciones', type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  accionesIds!: number[];
}

export class BulkDeletePermisosDto {
  @ApiProperty({ description: 'ID del grupo (perfil)' })
  @IsInt()
  grupoId!: number;

  @ApiProperty({ description: 'ID del menú' })
  @IsInt()
  menuId!: number;

  @ApiProperty({ description: 'IDs de las acciones a eliminar', type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  accionesIds!: number[];
}

export class GetPermisosGrupoDto {
  @ApiProperty({ description: 'ID del grupo (perfil)' })
  @IsInt()
  grupoId!: number;
}

export class GetPermisosUsuarioDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsInt()
  usuarioId!: number;
}

export class VerifyPermisoDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsInt()
  usuarioId!: number;

  @ApiProperty({ description: 'Código del menú', example: 'tickets' })
  menuCodigo!: string;

  @ApiProperty({ description: 'Código de la acción', example: 'view' })
  accionCodigo!: string;
}
