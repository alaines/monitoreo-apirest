import { Module } from '@nestjs/common';
import { EquiposController } from './equipos.controller';
import { EquiposService } from './equipos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermisosModule } from '../permisos/permisos.module';

@Module({
  imports: [PrismaModule, PermisosModule],
  controllers: [EquiposController],
  providers: [EquiposService],
  exports: [EquiposService],
})
export class EquiposModule {}
