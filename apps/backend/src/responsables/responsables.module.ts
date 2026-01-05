import { Module } from '@nestjs/common';
import { ResponsablesController } from './responsables.controller';
import { ResponsablesService } from './responsables.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermisosModule } from '../permisos/permisos.module';

@Module({
  imports: [PrismaModule, PermisosModule],
  controllers: [ResponsablesController],
  providers: [ResponsablesService],
  exports: [ResponsablesService],
})
export class ResponsablesModule {}
