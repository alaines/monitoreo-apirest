# ARCHIVO HISTÓRICO Y ELEMENTOS RETIRADOS
## Sistema de Control y Monitoreo de Intersecciones Semafóricas e Incidencias

Este directorio contiene archivos, scripts y documentos que han sido retirados del flujo activo del proyecto para mantener el código y la documentación limpios, pero que se conservan para referencia histórica y auditoría.

---

## 📂 Índice de Archivos Archivados

### 1. Archivos Archivados del Backend (`/archive/backend`)

| Archivo en Archive | Ubicación Original | Descripción / Razón de Archivo |
|---|---|---|
| `backend/query-estados.js` | `apps/backend/query-estados.js` | Script temporal para consultar catálogo de estados en la base de datos durante pruebas. |
| `backend/README_ENV.md` | `apps/backend/README_ENV.md` | Documento redundante con notas de variables de entorno (ya consolidado en `.env.example` y manuales). |
| `backend/pnpm-lock.yaml` | `apps/backend/pnpm-lock.yaml` | Archivo de bloqueo de pnpm no utilizado (el monorepo usa npm con `package-lock.json` en la raíz). |
| `backend/src/scripts/seed-catalogos.ts` | `apps/backend/src/scripts/seed-catalogos.ts` | Script de seed inicial de tipos de documentos y estados civiles (consolidado en `prisma/seed.ts`). |
| `backend/src/scripts/update-catalogos.ts` | `apps/backend/src/scripts/update-catalogos.ts` | Script de migración puntual para actualizar estados de catálogos a `true`. |

---

### 2. Archivos Archivados de la Raíz (`/archive`)

| Archivo en Archive | Ubicación Original | Descripción / Razón de Archivo |
|---|---|---|
| `test-tipos.js` | `test-tipos.js` | Script de prueba manual para verificar catálogo de tipos. |

---

### 3. Documentación Histórica y Borradores (`/archive`)

| Archivo en Archive | Ubicación Original | Descripción / Razón de Archivo |
|---|---|---|
| `DEPLOYMENT.md` | `docs/DEPLOYMENT.md` | Guía de despliegue consolidada en `docs/MANUAL_INSTALACION.md` y `docs/MANUAL_MANTENIMIENTO.md`. |
| `DEPLOYMENT_SUMMARY.md` | `docs/DEPLOYMENT_SUMMARY.md` | Resumen de despliegue histórico consolidado en `docs/ESTADO_PROYECTO_SPRINTS.md`. |
| `DEPLOYMENT_SUMMARY_SPRINT_8.md` | `docs/DEPLOYMENT_SUMMARY_SPRINT_8.md` | Resumen de cierre del Sprint 8 (notificaciones/presencia) consolidado en el balance de sprints. |
| `ESTADO-ACTUAL.md` | `docs/ESTADO-ACTUAL.md` | Documento de estado previo a la v1.2.0 consolidado en `docs/ESTADO_PROYECTO_SPRINTS.md`. |
| `ESTADO-ACTUAL-OLD.md` | `docs/ESTADO-ACTUAL-OLD.md` | Borrador antiguo de estado del proyecto. |
| `INSTALLATION.md` | `docs/INSTALLATION.md` | Guía de instalación consolidada en `docs/MANUAL_INSTALACION.md`. |
| `NETWORK-CONFIG.md` | `docs/NETWORK-CONFIG.md` | Configuración de red y servidores consolidada en `docs/MANUAL_INSTALACION.md`. |
| `PM2.md` | `docs/PM2.md` | Guía de PM2 consolidada en `docs/MANUAL_INSTALACION.md` y `docs/MANUAL_MANTENIMIENTO.md`. |
| `PROJECT_RULES.md` | `docs/PROJECT_RULES.md` | Reglas de proyecto consolidadas en `GEMINI.md` y `docs/MANUAL_MANTENIMIENTO.md`. |
| `QUICK-VERSION-GUIDE.md` | `docs/QUICK-VERSION-GUIDE.md` | Guía de versionamiento consolidada en `docs/MANUAL_MANTENIMIENTO.md`. |
| `DOCUMENTATION-SUMMARY.md` | `docs/DOCUMENTATION-SUMMARY.md` | Resumen de documentación reemplazado por `docs/README.md`. |
| `nginx-config.md` | `docs/nginx-config.md` | Configuración de Nginx consolidada en `docs/MANUAL_INSTALACION.md`. |
| `copilot-context.md` | `docs/copilot-context.md` | Notas de contexto de desarrollo histórico. |
