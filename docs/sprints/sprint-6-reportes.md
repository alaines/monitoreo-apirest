# Sprint 6: Sistema de Reportes

**Estado:** ✅ COMPLETADO (31 diciembre 2025)  
**Prioridad:** Alta  
**Estimacion:** 2 semanas  
**Tiempo Real:** 3 semanas

## Objetivo

Implementar sistema completo de generacion de reportes para analisis de incidencias, cruces, perifericos y estructuras, permitiendo la exportacion en multiples formatos (PDF, Excel) y visualizacion de estadisticas con graficos interactivos.

## Contexto

El sistema actual cuenta con un dashboard basico con KPIs de incidencias. Se requiere ampliar las capacidades de reporteria para permitir analisis mas profundos y exportacion de datos en formatos estandar para uso en presentaciones y analisis externos.

## User Stories

### US-6.1: Reporte de Incidencias por Periodo
**Como** supervisor  
**Quiero** generar reportes de incidencias filtradas por periodo temporal  
**Para** analizar tendencias y volumenes de trabajo

**Criterios de Aceptacion:**
- Filtros disponibles:
  - Rango de fechas (desde/hasta)
  - Estado (pendiente, en proceso, resuelto, cancelado)
  - Prioridad (alta, media, baja)
  - Equipo tecnico asignado
  - Distrito
- Visualizacion en tabla con paginacion
- Totalizadores por estado y prioridad
- Indicadores: tiempo promedio de resolucion, tickets abiertos vs cerrados
- Boton de exportacion a Excel y PDF

### US-6.2: Reporte de Cruces por Administrador
**Como** administrador  
**Quiero** generar reportes de cruces agrupados por entidad administradora  
**Para** tener control de inventario por responsable

**Criterios de Aceptacion:**
- Filtros:
  - Administrador
  - Distrito
  - Tipo de gestion
  - Tipo de comunicacion
- Agrupacion por administrador con totales
- Listado detallado de cruces por grupo
- Indicadores: total de cruces, cruces con perifericos, cruces sin perifericos
- Exportacion a Excel y PDF con formato profesional

### US-6.3: Reporte de Perifericos e Inventario
**Como** administrador  
**Quiero** generar reportes de inventario de perifericos  
**Para** control de activos tecnicos

**Criterios de Aceptacion:**
- Filtros:
  - Tipo de periferico
  - Fabricante
  - Estado operacional
  - En garantia (si/no)
  - Cruce asociado
- Agrupacion por tipo y fabricante
- Totalizadores: total perifericos, en garantia, fuera de garantia, por estado
- Alertas de garantias proximas a vencer (30 dias)
- Exportacion a Excel con detalle completo

### US-6.4: Graficos Estadisticos de Incidencias
**Como** supervisor  
**Quiero** ver graficos estadisticos de incidencias  
**Para** analisis visual de tendencias

**Criterios de Aceptacion:**
- Graficos implementados:
  - Grafico de barras: incidencias por mes (ultimo ano)
  - Grafico de torta: distribucion por prioridad
  - Grafico de lineas: tiempo promedio de resolucion por mes
  - Grafico de barras horizontal: incidencias por equipo tecnico
  - Grafico de barras: incidencias por distrito
- Interactividad: tooltips con valores exactos
- Filtros de periodo aplicables a todos los graficos
- Colores consistentes con el tema de la aplicacion

### US-6.5: Exportacion a Excel con Formato
**Como** usuario del sistema  
**Quiero** exportar reportes a Excel con formato profesional  
**Para** presentar datos en reuniones

**Criterios de Aceptacion:**
- Exportacion incluye:
  - Encabezado con titulo del reporte, fecha y usuario
  - Filtros aplicados en el reporte
  - Tabla con formato (bordes, colores alternados en filas)
  - Columnas con ancho automatico
  - Totalizadores en negrita
  - Logo de la entidad (opcional)
- Nombre de archivo: `reporte_[tipo]_[fecha].xlsx`
- Descarga automatica al generarse

### US-6.6: Exportacion a PDF con Formato
**Como** usuario del sistema  
**Quiero** exportar reportes a PDF  
**Para** archivar y distribuir informacion

**Criterios de Aceptacion:**
- PDF incluye:
  - Encabezado con logo, titulo, fecha
  - Filtros aplicados
  - Tabla con formato profesional
  - Paginacion automatica
  - Pie de pagina con numero de pagina
  - Totalizadores destacados
- Orientacion: vertical para reportes normales, horizontal para tablas anchas
- Nombre de archivo: `reporte_[tipo]_[fecha].pdf`

### US-6.7: Reporte de Tiempo de Atencion por Equipo
**Como** supervisor  
**Quiero** analizar tiempos de atencion por equipo tecnico  
**Para** evaluar desempeno

**Criterios de Aceptacion:**
- Metricas por equipo:
  - Cantidad de tickets asignados
  - Cantidad de tickets resueltos
  - Tiempo promedio de resolucion
  - Tickets pendientes
  - Tickets reasignados
- Comparativa entre equipos
- Grafico de barras comparativo
- Exportacion a Excel y PDF
- Filtro de periodo temporal

### US-6.8: Dashboard de Reportes
**Como** usuario del sistema  
**Quiero** una pagina dedicada a reportes  
**Para** acceder facilmente a todos los tipos de reporte

**Criterios de Aceptacion:**
- Crear pagina `/reportes` en menu lateral
- Cards con tipos de reportes disponibles:
  - Incidencias
  - Cruces
  - Perifericos
  - Estructuras (futuro)
  - Desempeno de equipos
- Cada card con icono descriptivo y boton "Generar"
- Modal para configurar parametros de cada reporte
- Historial de ultimos reportes generados (opcional)

### US-6.9: Reporte Programado (Futuro)
**Como** administrador  
**Quiero** programar generacion automatica de reportes  
**Para** recibir informacion periodica sin intervension manual

**Criterios de Aceptacion:**
- Configuracion de reportes programados:
  - Tipo de reporte
  - Frecuencia (diario, semanal, mensual)
  - Parametros fijos
  - Email de destino
- Almacenamiento de reportes generados
- Notificacion por email al generar
- NOTA: Esta funcionalidad se implementara en sprint futuro

### US-6.10: Reporte de Garantias Proximas a Vencer
**Como** administrador  
**Quiero** ver perifericos y estructuras con garantias proximas a vencer  
**Para** planificar renovaciones o reclamos

**Criterios de Aceptacion:**
- Filtro de dias para vencimiento (30, 60, 90 dias)
- Listado de perifericos/estructuras:
  - Tipo
  - Codigo
  - Cruce asociado
  - Fecha de garantia
  - Dias restantes
- Ordenamiento por dias restantes (ascendente)
- Exportacion a Excel
- Indicador visual (color rojo si < 15 dias, amarillo si < 30 dias)

## Tareas Tecnicas

### Backend
1. [ ] Crear modulo NestJS `reportes`
2. [ ] Implementar endpoints:
   - `POST /api/reportes/incidencias` - Generar reporte de incidencias
   - `POST /api/reportes/cruces` - Generar reporte de cruces
   - `POST /api/reportes/perifericos` - Generar reporte de perifericos
   - `POST /api/reportes/equipos` - Reporte de desempeno de equipos
   - `GET /api/reportes/garantias` - Garantias proximas a vencer
3. [ ] Implementar DTOs para filtros de reportes
4. [ ] Crear queries optimizadas con Prisma (agregaciones, joins)
5. [ ] Implementar generacion de Excel con libreria `exceljs`
6. [ ] Implementar generacion de PDF con `pdfmake` o similar
7. [ ] Calculos de metricas: promedios, totales, agrupaciones
8. [ ] Documentar endpoints en Swagger
9. [ ] Testing de generacion de reportes

### Frontend
1. [ ] Crear pagina `Reportes.tsx` en `/pages`
2. [ ] Crear componentes:
   - `ReporteIncidencias.tsx` - Configuracion y visualizacion
   - `ReporteCruces.tsx`
   - `ReportePerifericos.tsx`
   - `ReporteEquipos.tsx`
   - `ReporteGarantias.tsx`
3. [ ] Crear service `reportesService.ts` para llamadas API
4. [ ] Implementar formularios de filtros con validacion
5. [ ] Integrar libreria de graficos (Chart.js o Recharts)
6. [ ] Implementar graficos interactivos:
   - Barras
   - Torta/Dona
   - Lineas
7. [ ] Funcionalidad de descarga de archivos
8. [ ] Loading states durante generacion
9. [ ] Agregar opcion "Reportes" en menu lateral con icono
10. [ ] Estilos y responsividad
11. [ ] Testing de componentes

## Tecnologias Adicionales

### Backend
- `exceljs` - Generacion de archivos Excel con formato
- ~~`pdfkit`~~ - **REMOVIDO** (problemas con webpack bundles)
- ~~`pdfmake`~~ - No implementado
- Queries avanzadas con Prisma (groupBy, aggregate)

### Frontend
- `chart.js` 4.x + `react-chartjs-2` 5.x - Graficos interactivos ✅
- `jspdf` 3.x + `jspdf-autotable` 5.x - Generacion de PDFs en frontend ✅
- ~~`recharts`~~ - No implementado (se eligio Chart.js)
- `file-saver` - No necesario (descarga nativa con Blob)

## Implementacion Real

### Cambios vs Plan Original

1. **PDFKit Removido del Backend**: Problemas con fuentes en webpack bundles
   - Solucion: Generar PDFs en frontend con jsPDF
   - Beneficio: Menor carga en servidor, mejor escalabilidad

2. **Reporte Grafico Completo**: 
   - 5 graficos interactivos con Chart.js
   - Evolucion temporal adaptativa (hora/dia/mes segun periodo)
   - Top 5 averias con comparativa atendidas vs por atender
   - Filtrado especifico por "PROBLEMA - CRUCE" (parentId)
   - Clasificacion de estados con 5 categorias

3. **Exportacion PDF con Graficos**:
   - Captura de canvas de Chart.js a PNG
   - Insercion de imagenes en PDF (no tablas)
   - Paginacion automatica

4. **Excel Consolidado**:
   - Matriz cruces x tipos de incidencia
   - Hoja de detalle con listado completo
   - Formato profesional con estilos

### Archivos Creados

**Backend:**
- `apps/backend/src/reportes/reportes.controller.ts` (endpoints grafico)
- `apps/backend/src/reportes/reportes.service.ts` (logica getReporteGrafico)
- `apps/backend/src/reportes/dto/reporte-grafico.dto.ts`

**Frontend:**
- `apps/frontend/src/features/reportes/ReporteGrafico.tsx` (componente principal)
- `apps/frontend/src/services/reportes-grafico.service.ts` (cliente API)

**Documentacion:**
- `docs/REPORTE_GRAFICO.md` (documentacion completa)

**Eliminados:**
- `apps/frontend/src/components/DwgViewer.tsx` (no usado)

### Correcciones Importantes

- **Enums en Mayusculas**: PeriodoReporte (DIA, MES, ANIO) en frontend y backend
- **Referencias Chart.js**: useRef para captura de canvas
- **Validaciones**: Mensajes de "sin datos" en graficos vacios

## Definicion de Hecho

- [x] Todos los tipos de reportes implementados
- [x] Exportacion a Excel funcional con formato
- [x] Exportacion a PDF funcional con formato (frontend con jsPDF)
- [x] Graficos estadisticos interactivos (Chart.js)
- [x] Filtros aplicables en todos los reportes
- [x] Pagina de reportes accesible desde menu
- [x] Metricas calculadas correctamente
- [x] Performance aceptable (< 5 segundos para reportes grandes)
- [x] Sin errores en consola
- [x] Documentacion actualizada (docs/REPORTE_GRAFICO.md)

## Riesgos y Dependencias

### Riesgos
- Performance en reportes con grandes volumenes de datos (> 10,000 registros)
- Tamano de archivos Excel/PDF generados
- Compatibilidad de formatos entre diferentes sistemas operativos

### Dependencias
- Sprints 1-4 completados (incidencias, cruces, perifericos)
- Datos suficientes en BD para reportes significativos
- Librerias de generacion de archivos instaladas

## Notas Adicionales

- Los reportes deben respetar permisos de usuario (RBAC)
- Considerar cache para reportes frecuentes (futuro)
- Graficos con colores accesibles para personas con daltonismo
- Exportaciones deben incluir marca de agua o identificacion de origen

---

**Siguiente Sprint:** Sprint 7 - Modulo de Administracion
