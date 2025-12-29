# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Si descubres una vulnerabilidad de seguridad, por favor **NO** la reportes públicamente mediante issues.

En su lugar, envía un correo electrónico a: seguridad@monitoreo.gob.ec

Incluye:
- Descripción detallada de la vulnerabilidad
- Pasos para reproducirla
- Posible impacto
- Sugerencias de solución (opcional)

Nuestro equipo responderá dentro de 48 horas.

## Security Measures

### Variables de Entorno
Todas las credenciales y secretos deben almacenarse en GitHub Secrets:
- `DATABASE_URL`: Connection string de la base de datos
- `JWT_SECRET`: Secret para firma de tokens JWT
- `STAGING_API_URL`: URL del API en staging
- `PROD_API_URL`: URL del API en producción
- `PROD_DATABASE_URL`: URL de base de datos de producción

### Best Practices
- Nunca commitear credenciales en el código
- Usar variables de entorno para configuraciones sensibles
- Mantener dependencias actualizadas
- Ejecutar `npm audit` regularmente
- Revisar código antes de mergear a main
