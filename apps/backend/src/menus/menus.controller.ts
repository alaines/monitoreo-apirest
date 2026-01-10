import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenusService } from './menus.service';

@ApiTags('menus')
@ApiBearerAuth()
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los menús' })
  findAll() {
    return this.menusService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo menú' })
  create(@Body() createMenuDto: any) {
    return this.menusService.create(createMenuDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un menú' })
  update(@Param('id') id: string, @Body() updateMenuDto: any) {
    return this.menusService.update(+id, updateMenuDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un menú' })
  remove(@Param('id') id: string) {
    return this.menusService.remove(+id);
  }
}
