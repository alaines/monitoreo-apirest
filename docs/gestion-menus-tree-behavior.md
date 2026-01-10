# Sistema de Gestión de Menús con Tree Behavior

## Descripción

Este sistema implementa el patrón **Nested Set Model** (también conocido como **Modified Preorder Tree Traversal**) para gestionar menús jerárquicos de forma eficiente.

## Conceptos Clave

### Nested Set Model

El Nested Set Model representa árboles jerárquicos usando dos valores numéricos (`lft` y `rght`) que indican el rango de cada nodo en el árbol:

```
Inicio (1-2)
Operaciones (3-10)
  └─ Cruces (6-7)
Administración (15-26)
  ├─ Auditoría (24-25)
  ├─ Usuarios (60-63)
  └─ Grupos/Perfiles (64-67)
```

- **lft**: Número asignado al entrar al nodo
- **rght**: Número asignado al salir del nodo
- **Hijos**: Todos los nodos con `lft > padre.lft AND rght < padre.rght`
- **Nivel**: Se calcula como `(rght - lft - 1) / 2`

### Ventajas

1. **Consultas eficientes**: Obtener todos los descendientes con una sola query
2. **Ordenamiento**: El árbol siempre está ordenado por `lft`
3. **Nivel**: Se puede calcular sin joins recursivos
4. **Ancestros**: Fácil de obtener con `lft < node.lft AND rght > node.rght`

## Backend

### MenusService

#### Métodos Principales

**`rebuildTree()`**
Recalcula todos los valores `lft` y `rght` del árbol. Se ejecuta automáticamente después de:
- Crear un menú
- Actualizar un menú
- Eliminar un menú
- Mover un menú (up/down/change-parent)

```typescript
async rebuildTree(): Promise<void> {
  const menus = await this.prisma.menu.findMany({
    orderBy: { orden: 'asc' },
  });

  let counter = 1;
  const traverse = (parentId: number | null): number => {
    const children = menus.filter(m => m.parentId === parentId);
    children.forEach(menu => {
      const left = counter++;
      const right = traverse(menu.id);
      // Actualizar lft=left, rght=right
    });
    return counter++;
  };
  
  traverse(null);
}
```

**`getTree()`**
Obtiene el árbol completo ordenado por `lft`, incluyendo el nivel calculado:

```typescript
async getTree() {
  await this.rebuildTree();
  const menus = await this.prisma.menu.findMany({
    orderBy: [{ lft: 'asc' }],
  });
  
  return menus.map(menu => ({
    ...menu,
    nivel: (menu.rght - menu.lft - 1) / 2
  }));
}
```

**`moveUp(id)` / `moveDown(id)`**
Intercambia el orden con el hermano anterior/siguiente:

```typescript
async moveUp(id: number) {
  const menu = await this.prisma.menu.findUnique({ where: { id } });
  const previousSibling = await this.prisma.menu.findFirst({
    where: {
      parentId: menu.parentId,
      orden: { lt: menu.orden }
    },
    orderBy: { orden: 'desc' }
  });
  
  // Intercambiar órdenes
  await this.prisma.menu.update({ 
    where: { id: menu.id }, 
    data: { orden: previousSibling.orden } 
  });
  await this.prisma.menu.update({ 
    where: { id: previousSibling.id }, 
    data: { orden: menu.orden } 
  });
  
  await this.rebuildTree();
}
```

**`changeParent(id, newParentId)`**
Mueve un menú a un nuevo padre con validaciones:

```typescript
async changeParent(id: number, newParentId: number | null) {
  // Validar que el nuevo padre no sea el propio menú
  if (newParentId === id) {
    throw new BadRequestException('Un menú no puede ser padre de sí mismo');
  }
  
  // Validar que el nuevo padre no sea un descendiente
  const descendants = await this.getDescendants(id);
  if (descendants.some(d => d.id === newParentId)) {
    throw new BadRequestException('No se puede mover a un menú descendiente');
  }
  
  // Calcular el siguiente orden en el nuevo padre
  const siblings = await this.prisma.menu.findMany({
    where: { parentId: newParentId },
  });
  const nextOrden = Math.max(...siblings.map(s => s.orden || 0)) + 1;
  
  await this.prisma.menu.update({
    where: { id },
    data: { parentId: newParentId, orden: nextOrden }
  });
  
  await this.rebuildTree();
}
```

### MenusController

#### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/menus` | Lista todos los menús (plano) |
| GET | `/menus/tree` | Árbol con lft/rght/nivel |
| POST | `/menus` | Crear nuevo menú |
| PATCH | `/menus/:id` | Actualizar menú |
| DELETE | `/menus/:id` | Eliminar menú |
| PUT | `/menus/:id/move-up` | Mover hacia arriba |
| PUT | `/menus/:id/move-down` | Mover hacia abajo |
| PUT | `/menus/:id/change-parent` | Cambiar padre |
| POST | `/menus/rebuild-tree` | Forzar reconstrucción |

## Frontend

### MenusManagement Component

#### Características

1. **Visualización jerárquica**
   - Indentación visual basada en `nivel`
   - Símbolos `└─` para indicar hijos
   - Muestra `lft/rght` para debugging

2. **Operaciones disponibles**
   - ⬆️ **Subir**: Mueve el menú un nivel arriba entre hermanos
   - ⬇️ **Bajar**: Mueve el menú un nivel abajo entre hermanos
   - ✏️ **Editar**: Modificar propiedades del menú
   - 🗑️ **Eliminar**: Borrar menú (solo si no tiene hijos)
   - 📂 **Cambiar Padre**: Selector dropdown para mover a otro padre

3. **Modal CRUD**
   - Formulario para crear/editar
   - Campos: Nombre, Código, Ruta, Icono, Padre, Estado
   - Selector de padre con menús raíz disponibles
   - Validación en frontend y backend

4. **Actualización automática**
   - Recarga el árbol después de cada operación
   - Feedback con toast notifications
   - Manejo de errores

#### Ejemplo de uso

```typescript
// Cargar árbol
const loadMenus = async () => {
  const response = await axios.get(`${API_URL}/menus/tree`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  setMenus(response.data);
};

// Mover arriba
const handleMoveUp = async (id: number) => {
  await axios.put(`${API_URL}/menus/${id}/move-up`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  loadMenus();
};

// Cambiar padre
const handleChangeParent = async (id: number, newParentId: number | null) => {
  await axios.put(`${API_URL}/menus/${id}/change-parent`, 
    { newParentId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  loadMenus();
};
```

## Acceso a la Vista

1. Iniciar sesión con usuario **admin** / **Admin123**
2. Ir a **Panel de Control > Menu**
3. Ruta: `http://localhost:5173/admin/menus`

## Flujo de Trabajo

### Crear un Menú

1. Click en **"Nuevo Menú"**
2. Completar formulario:
   - **Nombre**: Texto visible en el sidebar
   - **Código**: Identificador único (ej: `inicio`, `admin-users`)
   - **Ruta**: Path de React Router (ej: `/inicio`, `/admin/users`)
   - **Icono**: Clase de FontAwesome (ej: `fas fa-home`)
   - **Menú Padre**: Seleccionar si es submenú (opcional)
   - **Activo**: Checkbox para habilitar/deshabilitar
3. Click en **"Crear"**
4. El árbol se reconstruye automáticamente

### Reordenar Menús

1. Localizar el menú en la tabla
2. Usar botones **↑ Subir** o **↓ Bajar** para mover entre hermanos
3. El campo `orden` se actualiza automáticamente
4. Los valores `lft/rght` se recalculan

### Mover a Otro Padre

1. Localizar el menú en la tabla
2. En la columna **"Padre"**, seleccionar el nuevo padre del dropdown
3. El menú se mueve al final de los hijos del nuevo padre
4. El árbol se reconstruye

### Eliminar un Menú

1. Localizar el menú en la tabla
2. Click en icono **🗑️ Eliminar**
3. Confirmar la acción
4. **Nota**: No se puede eliminar si tiene hijos (se debe mover los hijos primero)

## Base de Datos

### Tabla `menus`

```sql
CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES menus(id),
  lft INTEGER,
  rght INTEGER,
  name VARCHAR,
  estado BOOLEAN,
  url VARCHAR,
  icono VARCHAR,
  codigo VARCHAR(50) UNIQUE,
  modulo VARCHAR(50),
  orden INTEGER DEFAULT 0,
  created TIMESTAMP,
  modified TIMESTAMP
);
```

### Campos Clave

- **parent_id**: Referencia al menú padre (NULL para raíz)
- **lft**: Valor izquierdo del Nested Set
- **rght**: Valor derecho del Nested Set
- **orden**: Orden relativo entre hermanos

## Algoritmo de Reconstrucción

```typescript
function rebuildTree(parentId = null, counter = 1) {
  const children = menus
    .filter(m => m.parentId === parentId)
    .sort((a, b) => a.orden - b.orden);
  
  children.forEach(menu => {
    const left = counter++;
    const right = rebuildTree(menu.id, counter);
    
    // UPDATE menus SET lft = left, rght = right WHERE id = menu.id
    counter = right;
  });
  
  return counter++;
}
```

## Consultas Útiles

### Obtener todos los descendientes
```sql
SELECT * FROM menus 
WHERE lft > $padre_lft AND rght < $padre_rght
ORDER BY lft;
```

### Obtener todos los ancestros
```sql
SELECT * FROM menus 
WHERE lft < $nodo_lft AND rght > $nodo_rght
ORDER BY lft;
```

### Calcular profundidad
```sql
SELECT *, (rght - lft - 1) / 2 AS nivel 
FROM menus;
```

### Obtener hojas (sin hijos)
```sql
SELECT * FROM menus 
WHERE rght = lft + 1;
```

## Referencias

- [CakePHP Tree Behavior](https://book.cakephp.org/3/en/orm/behaviors/tree.html)
- [Nested Set Model Explained](http://mikehillyer.com/articles/managing-hierarchical-data-in-mysql/)
- [Modified Preorder Tree Traversal](https://www.sitepoint.com/hierarchical-data-database/)

## Troubleshooting

### Los valores lft/rght estan desincronizados
**Solucion**: Llamar a `POST /menus/rebuild-tree`

### No puedo mover un menu
**Posibles causas**:
- Intentando mover a si mismo
- Intentando mover a un descendiente
- Intentando crear ciclos en el arbol

### El orden no se actualiza
**Verificar**:
- Que `rebuildTree()` se llama despues de cambios
- Que el campo `orden` esta correcto en la BD
- Revisar logs del backend para errores

### Error 409 Conflict al crear menu
**Causa**: Ya existe un menu con el mismo codigo
**Solucion**: Usar un codigo unico para cada menu

### Permisos no aparecen para nuevo menu
**Verificar**:
- Que el grupo SUPER_ADMIN existe en la BD
- Revisar logs del backend para errores en auto-asignacion

## Permisos Automaticos

### Funcionamiento

Al crear un nuevo menu, el sistema automaticamente:

1. Busca el grupo SUPER_ADMIN en la base de datos
2. Si existe, crea un registro en `grupos_menus` con todos los permisos:
   - `view: true`
   - `create: true`
   - `edit: true`
   - `delete: true`

### Codigo relevante

```typescript
// En menus.service.ts - metodo create()
const superAdminGroup = await this.prisma.grupo.findFirst({
  where: { nombre: 'SUPER_ADMIN' },
});

if (superAdminGroup) {
  await this.prisma.gruposMenus.create({
    data: {
      grupoId: superAdminGroup.id,
      menuId: newMenu.id,
      view: true,
      create: true,
      edit: true,
      delete: true,
    },
  });
}
```

### Endpoint para guardado masivo

`POST /permisos/bulk-save`

Formato del body:
```json
{
  "permisos": [
    {
      "grupoId": 1,
      "menuId": 5,
      "view": true,
      "create": true,
      "edit": false,
      "delete": false
    }
  ]
}
```

## Auto-refresh del Sidebar

Cuando se realizan cambios en menus, el sidebar se actualiza automaticamente:

1. El frontend llama a `refreshUserMenus()` en el authStore
2. Este metodo hace una peticion a `GET /auth/me`
3. El backend retorna los menus actualizados del usuario
4. El sidebar se re-renderiza con los nuevos menus

### Uso en componentes

```typescript
const { refreshUserMenus } = useAuthStore();

const handleMenuChange = async () => {
  await menusService.create(data);
  await refreshUserMenus(); // Actualiza el sidebar
};
```

## Mejoras Futuras

- [ ] Drag & drop con react-beautiful-dnd
- [ ] Vista de árbol expandible/colapsable
- [ ] Bulk operations (mover múltiples menús)
- [ ] Historial de cambios (auditoría)
- [ ] Exportar/Importar estructura JSON
- [ ] Preview del sidebar en tiempo real
- [ ] Iconos con selector visual
