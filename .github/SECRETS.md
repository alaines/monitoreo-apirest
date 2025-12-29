# Configuración de GitHub Secrets

Para que el pipeline CI/CD funcione correctamente, necesitas configurar los siguientes secrets en tu repositorio de GitHub.

## 📝 Cómo agregar secrets

1. Ve a tu repositorio en GitHub
2. Click en **Settings** > **Secrets and variables** > **Actions**
3. Click en **New repository secret**
4. Agrega cada secret con su valor correspondiente

## 🔐 Secrets Requeridos

### Para CI (Opcional)
- **JWT_SECRET**
  - Descripción: Secret para firma de tokens JWT en tests E2E
  - Valor de ejemplo: `test-jwt-secret-key-minimum-32-characters-long`
  - Nota: En tests se usa un valor por defecto si no está configurado

### Para CD (Requerido para deployment)

- **STAGING_API_URL**
  - Descripción: URL del API en entorno de staging
  - Valor de ejemplo: `https://api-staging.monitoreo.gob.ec`

- **PROD_API_URL**
  - Descripción: URL del API en producción
  - Valor de ejemplo: `https://api.monitoreo.gob.ec`

- **PROD_DATABASE_URL**
  - Descripción: Connection string de PostgreSQL en producción
  - Formato: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`
  - Valor de ejemplo: `postgresql://transito:PASSWORD@192.168.18.230:5432/monitoreo?schema=public`
  - ⚠️ **IMPORTANTE**: Usar contraseña segura, nunca commitear este valor

## 🔧 Variables de Entorno por Ambiente

### Development (Local)
Configuradas en archivo `.env` (ver `.env.example`)

### Testing (CI Pipeline)
Configuradas en el workflow directamente o usando secrets

### Staging
```env
DATABASE_URL=${{ secrets.STAGING_DATABASE_URL }}  # Opcional
JWT_SECRET=${{ secrets.JWT_SECRET }}
NODE_ENV=staging
API_URL=${{ secrets.STAGING_API_URL }}
```

### Production
```env
DATABASE_URL=${{ secrets.PROD_DATABASE_URL }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
NODE_ENV=production
API_URL=${{ secrets.PROD_API_URL }}
```

## 🛡️ Mejores Prácticas

1. **Nunca commitear secrets** en el código fuente
2. **Rotar secrets** periódicamente (cada 90 días recomendado)
3. **Usar secrets diferentes** para cada ambiente
4. **JWT_SECRET** debe tener mínimo 32 caracteres
5. **Limitar acceso** a secrets solo a usuarios autorizados
6. **Auditar uso** de secrets regularmente

## 🔄 Rotar un Secret

1. Generar nuevo valor seguro
2. Actualizar en GitHub Secrets
3. Actualizar en servidor/aplicación
4. Verificar que todo funcione
5. Revocar el secret anterior

## 🆘 Troubleshooting

### Pipeline falla por secret no configurado
```
Error: Process completed with exit code 1.
```
**Solución**: Verificar que todos los secrets requeridos estén configurados en GitHub

### JWT_SECRET inválido
```
Error: JWT malformed
```
**Solución**: Verificar que JWT_SECRET tenga formato correcto y suficiente longitud

### Database connection failed
```
Error: Can't reach database server
```
**Solución**: Verificar que PROD_DATABASE_URL esté correctamente formateado y el servidor sea accesible
