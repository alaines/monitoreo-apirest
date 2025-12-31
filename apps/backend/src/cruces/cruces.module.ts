import { Module } from '@nestjs/common';
import { CrucesController } from './cruces.controller';
import { CrucesService } from './cruces.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CrucesController],
  providers: [CrucesService],
  exports: [CrucesService],
})
export class CrucesModule {}
