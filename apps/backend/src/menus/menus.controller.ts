import { Controller, Get, Post, Patch, Delete, Body, Param, Put } from '@nestjs/common';
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

  @Get('tree')
  @ApiOperation({ summary: 'Obtener árbol de menús con lft/rght' })
  getTree() {
    return this.menusService.getTree();
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

  @Put(':id/move-up')
  @ApiOperation({ summary: 'Mover menú hacia arriba' })
  moveUp(@Param('id') id: string) {
    return this.menusService.moveUp(+id);
  }

  @Put(':id/move-down')
  @ApiOperation({ summary: 'Mover menú hacia abajo' })
  moveDown(@Param('id') id: string) {
    return this.menusService.moveDown(+id);
  }

  @Put(':id/change-parent')
  @ApiOperation({ summary: 'Cambiar el padre de un menú' })
  changeParent(@Param('id') id: string, @Body() body: { newParentId: number | null }) {
    return this.menusService.changeParent(+id, body.newParentId);
  }

  @Post('rebuild-tree')
  @ApiOperation({ summary: 'Reconstruir el árbol (lft/rght)' })
  async rebuildTree() {
    await this.menusService.rebuildTree();
    return { message: 'Árbol reconstruido exitosamente' };
  }
}
