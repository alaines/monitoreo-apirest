import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
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
  ],
})
export class AppModule {}
