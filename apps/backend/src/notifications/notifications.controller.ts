import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService, NotificationType } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService, private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las notificaciones del usuario' })
  @ApiResponse({ status: 200, description: 'Notificaciones obtenidas exitosamente' })
  async findAll(
    @Request() req: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.notificationsService.findAllByUser(req.user.id, limit);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Obtener notificaciones no leídas' })
  @ApiResponse({ status: 200, description: 'Notificaciones no leídas obtenidas' })
  async findUnread(@Request() req: any) {
    return this.notificationsService.findUnreadByUser(req.user.id);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Obtener conteo de notificaciones no leídas' })
  @ApiResponse({ status: 200, description: 'Conteo obtenido exitosamente' })
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  async markAsRead(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({ status: 200, description: 'Todas las notificaciones marcadas como leídas' })
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar notificación' })
  @ApiResponse({ status: 200, description: 'Notificación eliminada' })
  async delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.delete(id, req.user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Eliminar todas las notificaciones' })
  @ApiResponse({ status: 200, description: 'Todas las notificaciones eliminadas' })
  async deleteAll(@Request() req: any) {
    return this.notificationsService.deleteAll(req.user.id);
  }

  // ENDPOINT DE PRUEBA - Enviar notificación de prueba
  @Post('test')
  @ApiOperation({ summary: 'Enviar notificación de prueba (solo desarrollo)' })
  @ApiResponse({ status: 201, description: 'Notificación de prueba enviada' })
  async sendTestNotification(@Request() req: any, @Body() body: { userId?: number; userIds?: number[]; all?: boolean; type?: string; title?: string; message?: string }) {
    const { userId, userIds, all, type, title, message } = body;

    if (!type || !title || !message) throw new BadRequestException('type, title and message are required');

    if (userId) {
      return this.notificationsService.create({ userId, type, title, message });
    }

    if (userIds && userIds.length > 0) {
      return this.notificationsService.createMultiple(userIds, { type, title, message });
    }

    if (all) {
      const users = await this.prisma.user.findMany({ where: { estado: true }, select: { id: true } });
      const ids = users.map((u) => u.id);
      return this.notificationsService.createMultiple(ids, { type, title, message });
    }

    throw new BadRequestException('userId or userIds or all flag required');
  }
}
