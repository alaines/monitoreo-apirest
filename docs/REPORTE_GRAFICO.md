# Reporte Gráfico de Incidencias

## Descripción

El módulo de **Reporte Gráfico** proporciona una visualización consolidada de las incidencias del sistema mediante gráficos interactivos y tablas dinámicas. Este reporte está basado en la estructura del archivo `reporte_grafico.xlsx` y ofrece múltiples vistas de análisis.

## Características

### Backend

#### Endpoints Disponibles

1. **GET `/api/reportes/grafico`**
   - Devuelve datos consolidados para visualización
   - Requiere autenticación JWT
   - Parámetros de filtrado (query params):
     - `periodo`: DIA | MES | ANIO | PERSONALIZADO
     - `mes`: 1-12 (requerido si periodo=MES)
     - `anio`: año (requerido si periodo=MES o ANIO)
     - `fechaInicio`: fecha inicio (formato ISO, requerido si periodo=PERSONALIZADO)
     - `fechaFin`: fecha fin (formato ISO, requerido si periodo=PERSONALIZADO)
     - `tipoIncidencia`: ID del tipo de incidencia (opcional)
     - `estadoId`: ID del estado (opcional)
     - `cruceId`: ID del cruce (opcional)
     - `administradorId`: ID del administrador (opcional)

2. **GET `/api/reportes/grafico/excel`**
   - Genera archivo Excel con datos consolidados
   - Requiere autenticación JWT
   - Mismos parámetros de filtrado que el endpoint anterior
   - Retorna archivo `.xlsx` con dos hojas:
     - **Consolidado**: Tabla pivot con incidencias por cruce y tipo
     - **Listado Detallado**: Detalle cronológico de cada incidencia

#### Estructura de Respuesta

```typescript
{
  resumen: {
    totalIncidencias: number;
    totalCruces: number;
    totalTipos: number;
  };
  consolidado: Array<{
    cruce: string;
    administrador: string;
    tipos: { [tipoIncidencia: string]: number };
    total: number;
  }>;
  graficos: {
    porTipo: Array<{ tipo: string; cantidad: number }>;
    porCruce: Array<{ cruce: string; cantidad: number }>; // Top 10
    porMes: Array<{ mes: string; cantidad: number }>;
    porEstado: Array<{ estado: string; cantidad: number }>;
  };
  tiposIncidencias: string[]; // Lista de todos los tipos
}
```

#### Lógica de Negocio

1. **Consolidación de Datos**:
   - Agrupa incidencias por cruce
   - Cuenta incidencias por tipo dentro de cada cruce
   - Calcula totales por cruce y generales

2. **Generación de Excel**:
   - Crea columnas dinámicas según tipos de incidencia existentes
   - Aplica estilos profesionales (colores, negritas, anchos de columna)
   - Incluye fila de totales generales
   - Genera hoja de detalle con información completa de cada incidencia

### Frontend

#### Componente: `ReporteGrafico.tsx`

Ubicación: `/apps/frontend/src/features/reportes/ReporteGrafico.tsx`

#### Características

1. **Filtros Interactivos**:
   - Selector de periodo (Día/Mes/Año/Personalizado)
   - Selector de mes y año
   - Rango de fechas personalizado

2. **Tarjetas de Resumen**:
   - Total de incidencias
   - Total de cruces afectados
   - Tipos de incidencias registrados

3. **Gráficos Interactivos** (Chart.js):
   - **Barras**: Incidencias por Tipo
   - **Barras**: Top 10 Cruces con más incidencias
   - **Pie**: Distribución por Estado
   - **Línea**: Tendencia Mensual

4. **Tabla Consolidada**:
   - Vista tipo pivot con cruces en filas
   - Columnas dinámicas por cada tipo de incidencia
   - Fila de totales generales
   - Colores diferenciados para mejor lectura

5. **Exportación**:
   - Botón para descargar Excel consolidado
   - Mantiene el mismo formato del archivo de referencia

#### Servicio: `reportes-grafico.service.ts`

Ubicación: `/apps/frontend/src/services/reportes-grafico.service.ts`

Métodos:
- `getReporteGrafico(filtros)`: Obtiene datos del backend
- `exportarExcel(filtros)`: Descarga archivo Excel

## Cambios en el Schema de Prisma

Se agregó la relación entre `Ticket` y `Estado` para facilitar las consultas:

```prisma
model Ticket {
  // ... otros campos
  estado Estado? @relation(fields: [estadoId], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "Tickets_to_estados")
}

model Estado {
  // ... otros campos
  tickets Ticket[]
}
```

## Eliminación de PDFKit

Se removieron completamente las dependencias de PDFKit del backend debido a problemas con archivos de fuentes en bundles de webpack:

- Desinstaladas: `pdfkit`, `@types/pdfkit`
- Eliminado método: `generarPDF()` del servicio
- Eliminado endpoint: `GET /api/reportes/incidencias/pdf`

La generación de PDFs ahora se realiza en el frontend usando `jsPDF` y `jsPDF-autoTable`.

## Menú de Navegación

El reporte gráfico se encuentra en el menú lateral:

```
Reportes
  ├─ Incidencias (vista con estadísticas)
  └─ Reporte Gráfico (nueva vista con gráficos)
```

## Dependencias Nuevas

### Frontend
- `chart.js`: ^4.x - Motor de gráficos
- `react-chartjs-2`: ^5.x - Wrapper de Chart.js para React

### Backend
- No se agregaron nuevas dependencias
- Se removieron: `pdfkit`, `@types/pdfkit`

## Uso

### Desde la Interfaz Web

1. Navegar a **Reportes > Reporte Gráfico**
2. Seleccionar periodo y filtros deseados
3. Click en "Buscar" para cargar datos
4. Visualizar gráficos y tabla consolidada
5. Click en "Exportar Excel" para descargar reporte

### Desde la API

```bash
# Obtener datos del reporte
curl -H "Authorization: Bearer $TOKEN" \
  "http://192.168.18.230:3001/api/reportes/grafico?periodo=MES&mes=1&anio=2025"

# Descargar Excel
curl -H "Authorization: Bearer $TOKEN" \
  "http://192.168.18.230:3001/api/reportes/grafico/excel?periodo=MES&mes=1&anio=2025" \
  -o reporte.xlsx
```

## Archivo de Referencia

El diseño se basó en `/docs/reporte_grafico.xlsx`:

- **Hoja 1 (Consolidado)**: Matriz de cruces × tipos de incidencia
- **Hoja 2 (Listado)**: Detalle cronológico con fecha, tipo, estado, etc.
- **Hoja 3 (GRAFICAS)**: Reservada para futuras visualizaciones

## Notas Técnicas

1. **Performance**: 
   - Top 10 cruces en gráfico de barras para evitar sobrecarga visual
   - Queries optimizadas con includes específicos
   - Carga asíncrona de datos

2. **Responsive**:
   - Gráficos adaptativos con `maintainAspectRatio: false`
   - Altura fija de 300px por gráfico
   - Grid de Bootstrap para layout

3. **Tipos de TypeScript**:
   - Interfaces completas para respuestas del backend
   - Tipado estricto en componentes React
   - Uso de `any` mínimo y controlado

## Próximas Mejoras

- [ ] Agregar más filtros (rango de fechas en gráfico de línea)
- [ ] Exportar gráficos a imagen PNG
- [ ] Programar envío automático de reportes por email
- [ ] Agregar gráfico de comparación entre periodos
- [ ] Dashboard con múltiples reportes en una sola vista
