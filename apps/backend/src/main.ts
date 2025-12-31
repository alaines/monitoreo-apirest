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
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation (configurar ANTES del global prefix)
  const config = new DocumentBuilder()
    .setTitle('Monitoreo API')
    .setDescription('Sistema de Gestión de Incidencias de Semáforos')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://192.168.18.230:3001/api/', 'LAN Backend')
    .addServer('http://localhost:3001/api/', 'Local Backend')
    .addTag('auth', 'Autenticación')
    .addTag('users', 'Gestión de Usuarios')
    .addTag('incidents', 'Gestión de Incidencias')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Global prefix ANTES de Swagger para que las rutas se generen correctamente
  app.setGlobalPrefix('api');
  
  // Swagger usando CDN para evitar problemas con rutas relativas
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
