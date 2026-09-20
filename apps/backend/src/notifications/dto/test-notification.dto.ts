import { IsString, IsOptional, IsNumber, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendTestNotificationDto {
  @ApiProperty({ required: false, description: 'ID del usuario destino' })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ required: false, description: 'Lista de IDs de usuario destino', type: [Number] })
  @IsOptional()
  @IsArray()
  userIds?: number[];

  @ApiProperty({ required: false, description: 'Enviar a todos los usuarios activos' })
  @IsOptional()
  @IsBoolean()
  all?: boolean;

  @ApiProperty({ description: 'Tipo de notificación', default: 'INCIDENCIA_NUEVA' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Título de la notificación' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  @IsString()
  message!: string;
}
