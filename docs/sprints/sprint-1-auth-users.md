# Sprint 1 - Autenticación y Gestión de Usuarios ✅ COMPLETADO

**Duración**: 1 día (28 diciembre 2025)  
**Objetivo**: Implementar sistema de autenticación y gestión básica de usuarios

**Estado**: ✅ COMPLETADO - Ver [sprint-1-COMPLETADO.md](sprint-1-COMPLETADO.md) para detalles

---

## 🎯 Objetivo del Sprint

Desarrollar el sistema de autenticación JWT, gestión de usuarios con roles (PUBLICO, OPERADOR, SUPERVISOR, ADMINISTRADOR) y control de permisos RBAC.

---

## 📋 Historias del Sprint

| ID | Historia | Story Points | Prioridad | Estado |
|----|----------|--------------|-----------|--------|
| US-001 | Como operador, necesito autenticarme con usuario y contraseña | 5 | ALTA | 📝 To Do |
| US-002 | Como administrador, necesito crear y gestionar usuarios | 8 | ALTA | 📝 To Do |
| TECH-007 | Implementar guards de autenticación | 3 | ALTA | 📝 To Do |
| TECH-008 | Implementar middleware de roles | 3 | ALTA | 📝 To Do |
| TECH-009 | Setup tests unitarios | 5 | MEDIA | 📝 To Do |

**Total Story Points**: 24

---

## 📝 Tareas Detalladas

### Backend (NestJS)

#### Módulo Auth
- [ ] Crear módulo de autenticación
- [ ] Implementar estrategia JWT (passport-jwt)
- [ ] Endpoint POST /api/auth/login
- [ ] Endpoint POST /api/auth/refresh
- [ ] Endpoint GET /api/auth/me
- [ ] Servicio de generación de tokens
- [ ] Validación de credenciales con bcrypt
- [ ] DTOs de login/registro

#### Módulo Users
- [ ] Crear módulo de usuarios
- [ ] Endpoint GET /api/users (lista con paginación)
- [ ] Endpoint GET /api/users/:id
- [ ] Endpoint POST /api/users (solo admin)
- [ ] Endpoint PUT /api/users/:id (solo admin)
- [ ] Endpoint DELETE /api/users/:id (solo admin)
- [ ] DTOs de usuario (create, update)
- [ ] Servicio de gestión de usuarios

#### Guards y Decoradores
- [ ] JwtAuthGuard
- [ ] RolesGuard
- [ ] @CurrentUser() decorator
- [ ] @Roles() decorator
- [ ] @Public() decorator (rutas públicas)

#### Base de Datos
- [ ] Migración inicial de Prisma
- [ ] Seed de usuarios de prueba
- [ ] Seed de roles/grupos

#### Tests
- [ ] Tests unitarios AuthService
- [ ] Tests unitarios UsersService
- [ ] Tests e2e login
- [ ] Tests e2e usuarios CRUD

---

### Frontend (React)

#### Feature Auth
- [ ] Crear estructura feature/auth
- [ ] LoginPage component
- [ ] LoginForm component
- [ ] AuthService (axios)
- [ ] AuthStore (Zustand)
- [ ] useAuth hook
- [ ] Manejo de tokens en localStorage
- [ ] Interceptor axios para tokens
- [ ] ProtectedRoute component

#### Feature Users
- [ ] Crear estructura feature/users
- [ ] UsersListPage (solo admin)
- [ ] UserForm component
- [ ] UserService
- [ ] useUsers hook

#### Shared Components
- [ ] Button component
- [ ] Input component
- [ ] Form component
- [ ] Card component
- [ ] Modal component

#### Router
- [ ] Configurar React Router
- [ ] Rutas públicas (/login)
- [ ] Rutas protegidas (/, /users)
- [ ] Redirección según autenticación
- [ ] Protección por roles

---

## 🎨 UI/UX

### Pantallas a diseñar
1. **Login**
   - Form con usuario/contraseña
   - Botón "Iniciar Sesión"
   - Mensaje de error
   - Loader durante login

2. **Layout Principal**
   - Header con nombre de usuario
   - Menú lateral según rol
   - Logout button
   - Indicador de rol

3. **Gestión de Usuarios** (solo admin)
   - Lista de usuarios con tabla
   - Filtros básicos
   - Botón "Nuevo Usuario"
   - Modal para crear/editar
   - Acciones (editar, eliminar)

---

## ✅ Criterios de Aceptación

### US-001: Login
- [x] Usuario puede ingresar usuario y contraseña
- [x] Sistema valida credenciales
- [x] Si son correctas, genera token JWT
- [x] Token se almacena en localStorage
- [x] Usuario es redirigido al dashboard
- [x] Si son incorrectas, muestra error claro
- [x] Token expira después de 7 días
- [x] Contraseñas encriptadas con bcrypt

### US-002: Gestión de Usuarios
- [x] Solo usuarios con rol ADMINISTRADOR pueden acceder
- [x] Puede ver lista de todos los usuarios
- [x] Puede crear nuevo usuario con datos completos
- [x] Puede editar usuario existente
- [x] Puede desactivar usuario (no eliminar físicamente)
- [x] Validación de campos requeridos
- [x] Email único
- [x] Usuario único
- [x] Asignación de rol obligatoria

---

## 🔧 Configuración Técnica

### Variables de Entorno Backend
```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d
BCRYPT_ROUNDS=10
```

### Prisma Schema
```prisma
model User {
  id           Int       @id @default(autoincrement())
  usuario      String    @unique
  passwordHash String
  grupoId      Int
  estado       Boolean   @default(true)
  // ... resto de campos
}
```

---

## 📊 Definition of Done

- [ ] Código implementado y commiteado
- [ ] Tests unitarios pasando (> 70% coverage)
- [ ] Tests e2e pasando
- [ ] Code review aprobado
- [ ] Documentación API actualizada (Swagger)
- [ ] Sin errores de TypeScript
- [ ] Sin warnings de ESLint
- [ ] Integrado en rama develop
- [ ] Demo funcional

---

## 🚀 Demo

Al final del sprint se debe poder demostrar:

1. **Login funcional**
   - Usuario se autentica correctamente
   - Token se genera y almacena
   - Redirección al dashboard

2. **CRUD de Usuarios** (como admin)
   - Crear usuario nuevo
   - Ver lista de usuarios
   - Editar usuario existente
   - Desactivar usuario

3. **Control de acceso**
   - Rutas protegidas requieren autenticación
   - Solo admin puede gestionar usuarios
   - Otros roles no ven menú de usuarios

---

## 📅 Planificación

### Semana 1
- **Días 1-2**: Setup backend (Auth + Users modules)
- **Días 3-4**: Implementar guards y seguridad
- **Día 5**: Tests backend

### Semana 2
- **Días 1-2**: Frontend login
- **Días 3-4**: Frontend gestión usuarios
- **Día 5**: Integración + Demo

---

## 🎯 Riesgos Identificados

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Problemas con migración de passwords | Alto | Media | Crear script de migración y testear |
| Complejidad de RBAC | Medio | Baja | Empezar simple, iterar después |
| Integración frontend-backend | Medio | Media | Probar temprano y frecuentemente |

---

## 📚 Referencias

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
