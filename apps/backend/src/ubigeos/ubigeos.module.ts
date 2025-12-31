import { Module } from '@nestjs/common';
import { UbigeosController } from './ubigeos.controller';
import { UbigeosService } from './ubigeos.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UbigeosController],
  providers: [UbigeosService, PrismaService],
  exports: [UbigeosService],
})
export class UbigeosModule {}
