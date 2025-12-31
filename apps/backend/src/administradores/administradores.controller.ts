import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdministradoresService } from './administradores.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('administradores')
@Controller('administradores')
export class AdministradoresController {
  constructor(private readonly administradoresService: AdministradoresService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener todos los administradores activos' })
  findAll() {
    return this.administradoresService.findAll();
  }
}
