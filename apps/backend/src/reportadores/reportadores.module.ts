import { Module } from '@nestjs/common';
import { ReportadoresController } from './reportadores.controller';
import { ReportadoresService } from './reportadores.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermisosModule } from '../permisos/permisos.module';

@Module({
  imports: [PrismaModule, PermisosModule],
  controllers: [ReportadoresController],
  providers: [ReportadoresService],
  exports: [ReportadoresService],
})
export class ReportadoresModule {}
