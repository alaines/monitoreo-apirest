import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir archivos estáticos de uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      skipMissingProperties: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix PRIMERO
  app.setGlobalPrefix('api');

  // Swagger documentation (configurar DESPUÉS del global prefix)
  const config = new DocumentBuilder()
    .setTitle('Monitoreo API')
    .setDescription('Sistema de Gestión de Incidencias de Semáforos')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://192.168.18.230:3001', 'Servidor LAN')
    .addServer('http://localhost:3001', 'Servidor Local')
    // Organización de tags por módulo
    .addTag('🔐 Autenticación', '')
    .addTag('auth', 'Autenticación y Seguridad')
    .addTag('👥 Administración', '')
    .addTag('users', 'Gestión de Usuarios')
    .addTag('grupos', 'Gestión de Grupos')
    .addTag('menus', 'Gestión de Menús')
    .addTag('acciones', 'Acciones de Permisos')
    .addTag('permisos', 'Gestión de Permisos')
    .addTag('�️ Mantenimientos', '')
    .addTag('areas', 'Áreas')
    .addTag('equipos', 'Equipos de Trabajo')
    .addTag('reportadores', 'Reportadores')
    .addTag('responsables', 'Responsables')
    .addTag('proyectos', 'Proyectos')
    .addTag('incidencias', 'Tipos de Incidencias')
    .addTag('📁 Catálogos', '')
    .addTag('tipos', 'Tipos Jerárquicos (Cruces)')
    .addTag('ubigeos', 'Ubigeos (Departamentos, Provincias, Distritos)')
    .addTag('administradores', 'Administradores de Entidades')
    .addTag('ejes', 'Ejes Viales')
    .addTag('🚦 Operaciones', '')
    .addTag('incidents', 'Gestión de Incidencias')
    .addTag('cruces', 'Gestión de Cruces')
    .addTag('perifericos', 'Gestión de Periféricos')
    .addTag('📊 Reportes', '')
    .addTag('reportes', 'Reportes y Estadísticas')
    .addTag('🔔 Notificaciones', '')
    .addTag('notifications', 'Notificaciones en Tiempo Real')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  
  // Swagger con configuración mejorada (ruta 'docs' porque el prefix 'api' ya se aplicó)
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Monitoreo API - Documentación',
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);

  const serverUrl = process.env.SERVER_URL || `http://192.168.18.230:${port}`;
  console.log(`🚀 Application is running on: ${serverUrl}/api`);
  console.log(`📚 Swagger docs available at: ${serverUrl}/docs`);
}

bootstrap();
