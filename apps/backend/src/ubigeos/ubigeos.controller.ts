import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { UbigeosService } from './ubigeos.service';

@ApiTags('ubigeos')
@Controller('ubigeos')
export class UbigeosController {
  constructor(private readonly ubigeosService: UbigeosService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener todos los ubigeos (distritos)' })
  @ApiResponse({ status: 200, description: 'Lista de ubigeos' })
  findAll() {
    return this.ubigeosService.findAll();
  }
}
