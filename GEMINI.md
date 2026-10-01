# REGLAS DEL PROYECTO MONITOREO-APIREST

## 1. Regla de Compilación y Reinicio Obligatorio
En CADA cambio que se realice en el frontend (`apps/frontend/`) o servicios asociados:
- **Compilar**: Ejecutar `docker exec monitoreo-frontend npm run build` para validar que no haya errores de TypeScript ni sintaxis (código de salida 0).
- **Reiniciar/Sincronizar**: Ejecutar `docker restart monitoreo-frontend` para asegurar que el servidor de desarrollo y el bundle del cliente queden 100% actualizados.

## 2. Reglas de Diseño y Estilo
- **Iconos**: Únicamente FontAwesome 6 (`fa-solid fa-*`). No emojis ni otras librerías.
- **CSS / UI**: Bootstrap 5.x puro (`container-fluid p-3`, `card`, `table`, etc.). Sin Tailwind CSS ni degradados inventados.
- **Márgenes**: Estandarizados a `container-fluid p-3` en todas las vistas del sistema.

## 3. Regla de Versionado y Registro de Cambios (SemVer)
En CADA cambio funcional, corrección o nueva característica que se implemente:
- **Esquema SemVer**: `MAJOR.MINOR.PATCH` (ej. `1.3.1`).
  - `PATCH`: Corrección de errores (bugfixes) y ajustes menores.
  - `MINOR`: Nuevas funcionalidades, nuevas vistas o mejoras significativas retrocompatibles.
  - `MAJOR`: Cambios estructurales mayores que rompen compatibilidad.
- **Archivos a sincronizar**:
  1. `VERSION`: Archivo plano con la versión actual (ej. `1.3.1`).
  2. `package.json` (raíz): `"version": "1.3.1"`
  3. `apps/frontend/package.json`: `"version": "1.3.1"`
  4. `apps/backend/package.json`: `"version": "1.3.1"`
  5. `apps/frontend/src/components/Layout.tsx`: Badge de versión en el pie de página (`v1.3.1`).
  6. `README.md`: Badge de versión en la cabecera.
- **Registro en CHANGELOG.md**:
  - Documentar bajo la versión y fecha correspondiente las secciones `### Agregado (Added)`, `### Corregido (Fixed)` o `### Mejorado (Changed)` siguiendo el estándar *Keep a Changelog*.

## 4. Regla de Despliegue a Desarrollo antes que Producción
En CADA cambio que se realice, el flujo OBLIGATORIO será el siguiente:
1. **Desarrollo Primero**: Realizar, compilar y desplegar (o reiniciar) los cambios ÚNICAMENTE en el servidor de desarrollo (`192.168.10.244`).
2. **Validación**: Esperar a que el usuario valide los cambios en desarrollo y dé explícitamente la instrucción "pásalo a producción".
3. **Pase a Producción**: SÓLO una vez recibida la instrucción, se procederá a subir los cambios a la rama principal (commit y push), hacer el pull en el servidor de producción (`192.168.10.241`) y reiniciar/compilar sus respectivos servicios.
