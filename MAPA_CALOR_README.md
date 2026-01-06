# Mapa de Calor de Incidencias

## 📍 Ubicación
**Menú:** Reportes → Mapa de Calor

**Ruta:** `/reportes/mapa`

## ✨ Características Implementadas

### 🎯 Funcionalidades Principales

1. **Visualización de Mapa de Calor**
   - Círculos concéntricos que representan la densidad de incidencias
   - Colores graduales según la intensidad (amarillo → naranja → rojo)
   - Radio variable según la concentración de incidencias cercanas

2. **Sistema de Intensidad**
   - **Baja (1-2):** Amarillo (#ffff00) - Radio 80m
   - **Media-Baja (2-3):** Dorado (#ffd700) - Radio 100m
   - **Media (3-5):** Naranja (#ffa500) - Radio 150m
   - **Media-Alta (5-7):** Tomate (#ff6347) - Radio 200m
   - **Alta (7-10):** Rojo (#dc143c) - Radio 250m
   - **Muy Alta (10+):** Rojo Oscuro (#8b0000) - Radio 300m

3. **Filtros Dinámicos**
   - ✅ **Año:** Últimos 5 años disponibles
   - ✅ **Mes:** 12 meses del año (opcional)
   - ✅ **Tipo de Incidencia:** Todos los tipos del catálogo

4. **Información en Popups**
   Cada círculo muestra al hacer click:
   - Tipo de incidencia
   - ID del reporte
   - Descripción
   - Cruce asociado
   - Fecha de registro
   - Intensidad (incidencias cercanas)
   - Prioridad

5. **Estadísticas en Tiempo Real**
   - Total de incidencias filtradas
   - Período seleccionado
   - Tipos diferentes de incidencias
   - Máxima densidad encontrada

6. **Leyenda Visual**
   - Código de colores explicado
   - Niveles de intensidad claramente definidos

### 🗺️ Tecnologías Utilizadas

- **React Leaflet:** Renderizado del mapa interactivo
- **OpenStreetMap:** Capa de tiles para el mapa base
- **Algoritmo de densidad:** Cálculo de incidencias cercanas en radio de ~1km
- **Auto-ajuste de vista:** El mapa se centra automáticamente en las incidencias filtradas

### 📊 Datos Requeridos

Las incidencias deben tener:
- `latitude` (número)
- `longitude` (número)
- `createdAt` (fecha)
- `incidenciaId` (tipo de incidencia)

**Nota:** Solo se visualizan incidencias con coordenadas válidas.

### 🎨 Interfaz de Usuario

- **Panel de filtros colapsable**
- **Contador de incidencias en tiempo real**
- **Botón "Limpiar" para resetear filtros**
- **Diseño responsive**
- **Altura del mapa:** 600px
- **Estilos consistentes** con el resto del sistema

### 🚀 Uso

1. Acceder a **Reportes → Mapa de Calor**
2. El mapa carga todas las incidencias del año actual
3. Aplicar filtros según necesidad:
   - Seleccionar año específico
   - Seleccionar mes (opcional)
   - Filtrar por tipo de incidencia
4. Hacer click en los círculos para ver detalles
5. El mapa se ajusta automáticamente a los datos visibles

### 📈 Casos de Uso

- **Análisis de zonas críticas:** Identificar áreas con mayor concentración de incidencias
- **Planificación de mantenimiento:** Priorizar cruces según densidad de problemas
- **Reportes mensuales:** Visualizar tendencias por mes
- **Análisis por tipo:** Identificar qué tipos de incidencias son más frecuentes y dónde
- **Comparación anual:** Evaluar evolución de incidencias año tras año

### 🔧 Configuración del Algoritmo

**Radio de búsqueda:** 0.01 grados (≈1.1 km)

```typescript
const radius = 0.01; // Radio para calcular densidad
const getHeatIntensity = (lat, lng) => {
  return incidencias.filter(i => 
    distancia(i.coords, [lat, lng]) <= radius
  ).length;
}
```

### 💡 Mejoras Futuras Sugeridas

- [ ] Agregar filtro por prioridad
- [ ] Exportar mapa como imagen
- [ ] Clusterización de marcadores para mejor rendimiento
- [ ] Animación temporal (slider de meses)
- [ ] Comparación entre períodos
- [ ] Filtro por estado de incidencia
- [ ] Integración con reportes PDF/Excel

---

**Fecha de implementación:** 6 de enero de 2026  
**Versión:** 1.0  
**Despliegue:** Producción (Restart #23, PID: 2823164)
