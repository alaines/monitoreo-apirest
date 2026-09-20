# REGLAS DEL PROYECTO MONITOREO-APIREST

## 1. Regla de Compilación y Reinicio Obligatorio
En CADA cambio que se realice en el frontend (`apps/frontend/`) o servicios asociados:
- **Compilar**: Ejecutar `docker exec monitoreo-frontend npm run build` para validar que no haya errores de TypeScript ni sintaxis (código de salida 0).
- **Reiniciar/Sincronizar**: Ejecutar `docker restart monitoreo-frontend` para asegurar que el servidor de desarrollo y el bundle del cliente queden 100% actualizados.

## 2. Reglas de Diseño y Estilo
- **Iconos**: Únicamente FontAwesome 6 (`fa-solid fa-*`). No emojis ni otras librerías.
- **CSS / UI**: Bootstrap 5.x puro (`container-fluid p-3`, `card`, `table`, etc.). Sin Tailwind CSS ni degradados inventados.
- **Márgenes**: Estandarizados a `container-fluid p-3` en todas las vistas del sistema.
