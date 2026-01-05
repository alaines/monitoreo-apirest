import { Module } from '@nestjs/common';
import { IncidenciasController } from './incidencias.controller';
import { IncidenciasService } from './incidencias.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermisosModule } from '../permisos/permisos.module';

@Module({
  imports: [PrismaModule, PermisosModule],
  controllers: [IncidenciasController],
  providers: [IncidenciasService],
  exports: [IncidenciasService],
})
export class IncidenciasModule {}
