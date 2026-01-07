import { Module } from '@nestjs/common';
import { EstadoCivilsController } from './estado-civils.controller';
import { EstadoCivilsService } from './estado-civils.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EstadoCivilsController],
  providers: [EstadoCivilsService],
  exports: [EstadoCivilsService],
})
export class EstadoCivilsModule {}
