import { Module } from '@nestjs/common';
import { PerifericosController } from './perifericos.controller';
import { PerifericosService } from './perifericos.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PerifericosController],
  providers: [PerifericosService],
  exports: [PerifericosService],
})
export class PerifericosModule {}
