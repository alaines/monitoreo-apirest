import { Module } from '@nestjs/common';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermisosModule } from '../permisos/permisos.module';

@Module({
  imports: [PrismaModule, PermisosModule],
  controllers: [AreasController],
  providers: [AreasService],
  exports: [AreasService],
})
export class AreasModule {}
