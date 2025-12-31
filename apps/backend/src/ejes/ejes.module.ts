import { Module } from '@nestjs/common';
import { EjesController } from './ejes.controller';
import { EjesService } from './ejes.service';

@Module({
  controllers: [EjesController],
  providers: [EjesService],
  exports: [EjesService],
})
export class EjesModule {}
