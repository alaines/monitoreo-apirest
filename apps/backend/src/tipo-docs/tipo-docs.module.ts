import { Module } from '@nestjs/common';
import { TipoDocsController } from './tipo-docs.controller';
import { TipoDocsService } from './tipo-docs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TipoDocsController],
  providers: [TipoDocsService],
  exports: [TipoDocsService],
})
export class TipoDocsModule {}
