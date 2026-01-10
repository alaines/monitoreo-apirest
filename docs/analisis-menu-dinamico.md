# Análisis: Menú Lateral Dinámico desde Base de Datos

**Fecha:** 9 de enero de 2026  
**Estado Actual:** ❌ Menús hardcodeados en Layout.tsx  
**Estado Deseado:** ✅ Menús cargados dinámicamente desde la BD

---

## 1. Situación Actual

### Implementación Actual
El menú lateral del sistema está **completamente hardcodeado** en el componente `Layout.tsx`. Cada elemento del menú, sus iconos, rutas, submenús y orden están definidos directamente en el código JSX.

**Ubicación:** `apps/frontend/src/components/Layout.tsx` (líneas 190-750 aprox.)

### Problemas Identificados

1. **Falta de Flexibilidad**: Para agregar/modificar/eliminar menús hay que editar código
2. **No hay Control de Permisos por Menú**: Aunque existe `canManageUsers`, no está vinculado a la BD
3. **Inconsistencia**: La tabla `menus` existe en la BD pero no se usa en el frontend
4. **Dificultad de Mantenimiento**: Cambios requieren compilación y despliegue

### Estructura Hardcodeada Detectada

```
📋 Menús Principales (6):
├─ 1. Inicio (fas fa-chart-line) → /
├─ 2. Incidencias (fas fa-ticket-alt) → /incidents
├─ 3. Cruces (fas fa-traffic-light) → # [submenu]
│   ├─ Gestión (fas fa-list) → /cruces
│   └─ Mapa (fas fa-map-marked-alt) → /cruces/mapa
├─ 4. Reportes (fas fa-file-alt) → # [submenu]
│   ├─ Incidencias (fas fa-ticket-alt) → /reportes/incidencias
│   ├─ Reporte Gráfico (fas fa-chart-bar) → /reportes/grafico
│   └─ Mapa de Calor (fas fa-map-marked-alt) → /reportes/mapa
├─ 5. Mantenimientos (fas fa-cogs) → # [submenu] [requiere permiso]
│   ├─ Tipos (fas fa-folder-tree) → /mantenimientos/tipos
│   ├─ Áreas (fas fa-building) → /mantenimientos/areas
│   ├─ Equipos (fas fa-users-cog) → /mantenimientos/equipos
│   ├─ Reportadores (fas fa-user-tie) → /mantenimientos/reportadores
│   ├─ Responsables (fas fa-user-check) → /mantenimientos/responsables
│   ├─ Administradores (fas fa-user-shield) → /mantenimientos/administradores
│   ├─ Ejes (fas fa-road) → /mantenimientos/ejes
│   ├─ Proyectos (fas fa-project-diagram) → /mantenimientos/proyectos
│   └─ Tipos de Incidencias (fas fa-exclamation-triangle) → /mantenimientos/incidencias
└─ 6. Panel de Control (fas fa-tools) → # [submenu] [requiere permiso]
    ├─ Usuarios (fas fa-users) → /admin/users
    ├─ Grupos y Permisos (fas fa-shield-alt) → /admin/grupos
    ├─ Menús (fas fa-bars) → /admin/menus
    └─ Catálogos (fas fa-list) → /admin/catalogos

Total: 6 menús principales + 18 submenús = 24 elementos
```

---

## 2. Estado de la Base de Datos

### Tabla `menus` (Estructura Prisma)

```prisma
model Menu {
  id          Int         @id @default(autoincrement())
  parentId    Int?        @map("parent_id")
  lft         Int?
  rght        Int?
  name        String?     @db.VarChar
  estado      Boolean?
  url         String?     @db.VarChar
  icono       String?     @db.VarChar
  created     DateTime?   @db.Timestamp(6)
  modified    DateTime?   @db.Timestamp(6)
  codigo      String?     @unique @db.VarChar(50)
  modulo      String?     @db.VarChar(50)
  orden       Int?        @default(0)
  gruposMenus GrupoMenu[]

  @@index([codigo], map: "idx_menus_codigo")
  @@map("menus")
}
```

### Datos Actuales en BD

- **55 registros** encontrados
- Mezcla de estructura antigua (URLs legacy tipo `incidencia/tickets`)
- Algunos menús duplicados
- Orden inconsistente
- **NO coincide con la estructura actual del Layout.tsx**

### Relación con Permisos

Existe la tabla `grupos_menus` que relaciona:
- `grupoId` (grupos de usuarios)
- `menuId` (menús)
- `accionId` (acciones: ver, crear, editar, eliminar)

**Esta funcionalidad existe pero NO se está utilizando en el frontend actual.**

---

## 3. Snapshot Creado

Se han creado dos archivos para preservar la estructura actual:

### `scripts/menu-snapshot.json`
Contiene la estructura actual en formato JSON con:
- 24 menús totales
- IDs asignados
- Jerarquía (menuPadreId)
- Iconos FontAwesome
- Rutas completas
- Orden de visualización
- Códigos únicos

### `scripts/insert-menus.sql`
Script SQL para insertar la estructura en la BD:
- Limpia tablas existentes (grupos_menus y menus)
- Inserta 24 menús con estructura jerárquica
- Resetea secuencias
- Incluye verificación final

---

## 4. Propuesta de Implementación

### Fase 1: Preparación de BD ✅
- [x] Crear snapshot JSON de estructura actual
- [x] Crear script SQL de inserción
- [ ] Ejecutar script en BD de desarrollo
- [ ] Verificar datos insertados

### Fase 2: Backend (NestJS)
- [ ] Crear endpoint `GET /auth/user/menus` que devuelva menús según permisos del usuario
- [ ] Modificar servicio de autenticación para incluir menús en el login
- [ ] Implementar lógica de permisos por grupo en `grupos_menus`

### Fase 3: Frontend (React)
- [ ] Crear servicio `menuService.ts` para obtener menús
- [ ] Crear componente `DynamicMenuItem.tsx` para renderizar menús recursivamente
- [ ] Modificar `Layout.tsx` para cargar menús desde API
- [ ] Agregar estado en `authStore` para almacenar menús del usuario
- [ ] Implementar renderizado dinámico de menús con submenús colapsables

### Fase 4: Integración con Permisos
- [ ] Modificar login para cargar menús junto con datos del usuario
- [ ] Implementar filtrado de menús según permisos del grupo
- [ ] Agregar validación de permisos en rutas protegidas

### Fase 5: Testing y Despliegue
- [ ] Probar con diferentes grupos de usuarios
- [ ] Verificar permisos funcionan correctamente
- [ ] Desplegar en producción
- [ ] Actualizar documentación

---

## 5. Estructura Propuesta del API

### Endpoint de Login (Modificado)
```typescript
POST /api/auth/login
Response: {
  token: string;
  user: {
    id: number;
    usuario: string;
    grupo: {
      id: number;
      nombre: string;
    };
    menus: Menu[]; // ← NUEVO
  }
}
```

### Tipo Menu (Frontend)
```typescript
interface Menu {
  id: number;
  nombre: string;
  icono: string;
  ruta: string;
  orden: number;
  menuPadreId: number | null;
  activo: boolean;
  submenus?: Menu[];
  permisos?: {
    ver: boolean;
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
  };
}
```

---

## 6. Beneficios de la Implementación

### Operacionales
✅ Cambios de menú sin necesidad de código  
✅ Control centralizado desde Panel de Control → Menús  
✅ Permisos granulares por grupo de usuario  
✅ Auditoría de cambios en menús  

### Técnicos
✅ Separación de lógica de presentación y configuración  
✅ Menor acoplamiento en el código  
✅ Facilita mantenimiento a largo plazo  
✅ Escalabilidad para multi-tenant  

### Seguridad
✅ Usuarios solo ven menús permitidos  
✅ Validación de permisos en backend  
✅ Imposible acceder a rutas sin permiso  

---

## 7. Plan de Ejecución

### Orden Recomendado
1. Ejecutar `insert-menus.sql` en BD
2. Crear endpoint backend de menús con permisos
3. Modificar authStore para incluir menús
4. Crear componente DynamicMenu
5. Reemplazar menús hardcodeados gradualmente
6. Testing por grupo de usuarios
7. Despliegue en producción

### Tiempo Estimado
- Fase 1: ✅ Completada (snapshot creado)
- Fase 2-3: 4-6 horas
- Fase 4: 2-3 horas
- Fase 5: 2 horas
**Total: ~8-11 horas de desarrollo**

---

## 8. Archivos de Referencia

- **Snapshot JSON**: `scripts/menu-snapshot.json`
- **Script SQL**: `scripts/insert-menus.sql`
- **Layout actual**: `apps/frontend/src/components/Layout.tsx`
- **Modelo Prisma**: `apps/backend/prisma/schema.prisma` (línea 90)
- **Servicio menús backend**: `apps/backend/src/menus/menus.service.ts`

---

## Conclusión

La estructura de menús actual está **hardcodeada** y debe migrarse a un sistema **dinámico basado en BD**. Se ha creado un snapshot completo de la estructura actual para preservarla antes de la migración. La implementación propuesta permitirá control total desde la interfaz de administración y permisos granulares por grupo de usuario.
