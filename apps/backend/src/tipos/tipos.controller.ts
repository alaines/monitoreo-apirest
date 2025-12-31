import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { TiposService } from './tipos.service';

@ApiTags('tipos')
@Controller('tipos')
export class TiposController {
  constructor(private readonly tiposService: TiposService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener todos los tipos' })
  findAll() {
    return this.tiposService.findAll();
  }
}
