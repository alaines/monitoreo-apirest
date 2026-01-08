import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { IncidentsModule } from './incidents/incidents.module';
import { CrucesModule } from './cruces/cruces.module';
import { PerifericosModule } from './perifericos/perifericos.module';
import { TiposModule } from './tipos/tipos.module';
import { UbigeosModule } from './ubigeos/ubigeos.module';
import { AdministradoresModule } from './administradores/administradores.module';
import { EjesModule } from './ejes/ejes.module';
import { ReportesModule } from './reportes/reportes.module';
import { AccionesModule } from './acciones/acciones.module';
import { PermisosModule } from './permisos/permisos.module';
import { GruposModule } from './grupos/grupos.module';
import { MenusModule } from './menus/menus.module';
import { AreasModule } from './areas/areas.module';
import { EquiposModule } from './equipos/equipos.module';
import { ReportadoresModule } from './reportadores/reportadores.module';
import { ResponsablesModule } from './responsables/responsables.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { IncidenciasModule } from './incidencias/incidencias.module';
import { TipoDocsModule } from './tipo-docs/tipo-docs.module';
import { EstadoCivilsModule } from './estado-civils/estado-civils.module';
import { CommonModule } from './common/common.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    IncidentsModule,
    CrucesModule,
    PerifericosModule,
    TiposModule,
    UbigeosModule,
    AdministradoresModule,
    EjesModule,
    ReportesModule,
    AccionesModule,
    PermisosModule,
    GruposModule,
    MenusModule,
    AreasModule,
    EquiposModule,
    ReportadoresModule,
    ResponsablesModule,
    ProyectosModule,
    IncidenciasModule,
    TipoDocsModule,
    EstadoCivilsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
