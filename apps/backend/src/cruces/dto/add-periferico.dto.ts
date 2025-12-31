import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPerifericoDto {
  @ApiProperty({ description: 'ID del periférico', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  perifericoId: number;
}
