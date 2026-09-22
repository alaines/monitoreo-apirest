import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { BiDashboardController } from './bi-dashboard.controller';
import { BiDashboardService } from './bi-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportesController, BiDashboardController],
  providers: [ReportesService, BiDashboardService],
  exports: [ReportesService, BiDashboardService],
})
export class ReportesModule {}
