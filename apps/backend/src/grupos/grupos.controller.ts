import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GruposService } from './grupos.service';

@ApiTags('grupos')
@ApiBearerAuth()
@Controller('grupos')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los grupos' })
  findAll() {
    return this.gruposService.findAll();
  }
}
