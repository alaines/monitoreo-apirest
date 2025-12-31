import { Module } from '@nestjs/common';
import { TiposController } from './tipos.controller';
import { TiposService } from './tipos.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TiposController],
  providers: [TiposService, PrismaService],
  exports: [TiposService],
})
export class TiposModule {}
