import { Module, Global } from '@nestjs/common';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { PermisosModule } from '../permisos/permisos.module';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PermisosModule, PrismaModule],
  providers: [PermissionsGuard, AuditInterceptor],
  exports: [PermissionsGuard, AuditInterceptor],
})
export class CommonModule {}
