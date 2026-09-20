# MANUAL DE USUARIO
## Sistema de Control y Monitoreo de Intersecciones Semafóricas e Incidencias
**Versión del Sistema**: v1.2.0  
**Entidad**: División de Monitoreo y Control - SGF - GMU  
**Fecha de Actualización**: Septiembre 2026  

---

## 1. Introducción y Acceso al Sistema

El **Sistema de Control y Monitoreo** es una plataforma web integral diseñada para la supervisión en tiempo real de la red semafórica metropolitana, gestión del ciclo de vida de incidencias técnicas, inventario de infraestructura vial y generación de análisis estadísticos.

### 1.1. Requisitos de Acceso
- **Navegador Web Recomendado**: Google Chrome, Mozilla Firefox o Microsoft Edge (versiones actualizadas).
- **Conexión de Red**: Acceso a la red corporativa o VPN autorizada.
- **URL de Acceso**: `http://localhost:5173` (Desarrollo) o dominio institucional asignado.

### 1.2. Inicio de Sesión y Perfil
1. Ingrese su **Nombre de Usuario** y **Contraseña**.
2. Haga clic en **"Iniciar Sesión"**.
3. En la barra superior (Header) podrá visualizar su nombre de usuario, rol actual y el botón para **"Cerrar Sesión"** o editar datos de perfil.

---

## 2. Centro de Control y Monitoreo (Dashboard Principal)

La pantalla de **Inicio** es el centro operativo en tiempo real para operadores y supervisores.

```
+-----------------------------------------------------------------------------------------------+
| Centro de Control y Monitoreo                                      [Actualizar] [Ver Incid.] |
+------------------+------------------+------------------+------------------+-------------------+
| PENDIENTES HOY   | CERRADOS HOY     | TOTAL ACTIVOS    | TOTAL RESUELTOS  | INTERSECCIONES    |
|       0          |       0          |      1628        |     60753        | APAGADAS: 29      |
+------------------+------------------+------------------+------------------+-------------------+
| [ Mapa de Incidencias Georreferenciadas con Clustering Jerárquico por Severidad ]              |
|                                                                     [Filtros: Año | Mes | Adm]|
+-----------------------------------------------------------------------------------------------+
```

### 2.1. Indicadores Clave de Desempeño (KPIs)
- **Pendientes Hoy**: Tickets asignados o reasignados registrados en el día en curso.
- **Cerrados Hoy**: Tickets resueltos o finalizados en la fecha actual.
- **Total Activos**: Sumatoria global de todas las incidencias abiertas que requieren atención (`ASIGNADO`, `EN PROCESO`, `REASIGNADO`).
- **Total Resueltos**: Histórico acumulado de tickets cerrados satisfactoriamente.
- **Intersecciones Apagadas (Alerta Crítica)**: Contador de semáforos totalmente apagados (`Incidencia #66`). Al hacer clic, filtra directamente en el listado para atención urgente.

### 2.2. Mapa Interactivo de Incidencias Georreferenciadas
El mapa integra **agrupación dinámica jerárquica (Clustering)** según el nivel de severidad:

#### Jerarquía de Colores en Clusters (Grupos de Semáforos):
- <span style="color: #dc3545; font-weight: bold;">🔴 Cluster Rojo (Crítico)</span>: Contiene al menos una incidencia de alta prioridad, siniestro o cruce apagado.
- <span style="color: #f59f00; font-weight: bold;">🟡 Cluster Ámbar (Medio)</span>: Contiene incidencias de prioridad media o en proceso de atención técnica.
- <span style="color: #1d4469; font-weight: bold;">🔵 Cluster Azul Marino (Normal / Bajo)</span>: Intersecciones con reportes leves o estado operativo normal.

#### Marcadores Individuales (Zoom Máximo / Aislados):
- **Peligro / Crítico**: Círculo rojo con icono de advertencia (`fa-solid fa-triangle-exclamation`).
- **Operativo / Normal**: Círculo azul marino con icono de semáforo (`fa-solid fa-traffic-light`).

#### Interacción con el Marcador:
Al hacer clic en cualquier marcador individual se despliega la **Ficha Técnica Rápida (Popup)** que detalla:
- Código oficial de la intersección (ej: `[C01165]`).
- Nombre de las vías que conforman el cruce.
- Distrito de ubicación.
- Tipo de incidencia y badges de prioridad/estado.
- Tiempo transcurrido sin atención.
- Botón **"Gestionar / Ver Incidencia"** para abrir el modal de seguimiento y resolución.

### 2.3. Filtros Rápidos del Mapa
- **Año**: Permite seleccionar el año de registro histórico.
- **Mes**: Selector de mes (por defecto inicia con el mes actual en curso o permite ver "Todos").
- **Administrado por**: Filtrado por entidad gestora (Municipalidad de Lima, Gobiernos Locales, Concesiones viales, etc.).

---

## 3. Módulo de Gestión de Incidencias

### 3.1. Registro de Nuevas Incidencias
1. Diríjase a **Incidencias > Nueva Incidencia** (o botón superior "+ Registrar").
2. Seleccione la **Intersección / Cruce** involucrado (el sistema heredará automáticamente las coordenadas geográficas).
3. Seleccione el **Tipo de Incidencia** del catálogo jerárquico.
4. Asigne la **Prioridad** (`ALTA`, `MEDIA`, `BAJA`).
5. (Opcional) Asigne el **Equipo Técnico** responsable y detalle el reporte inicial.
6. Haga clic en **"Guardar Incidencia"**.

### 3.2. Listado y Seguimiento (Workflow de Estados)
Las incidencias transicionan por los siguientes estados:
- **ASIGNADO (1)**: Incidencia registrada a la espera de cuadrilla o evaluación.
- **EN PROCESO (2)**: Cuadrilla técnica en campo o en diagnóstico activo.
- **REASIGNADO (5)**: Reasignado a otra especialidad (civil, eléctrica, comunicaciones).
- **RESUELTO - FINALIZADO (4)**: Avería subsanada y verificada en el centro de control.
- **CANCELADO (3)**: Reporte duplicado o falsa alarma.

### 3.3. Modal de Detalle y Seguimiento (Timeline)
En el modal de detalle se puede:
- Ver el historial cronológico completo de intervenciones.
- Registrar un nuevo seguimiento con diagnóstico técnico y cambio de estado.
- Consultar datos de suministro eléctrico, empresa proveedora y fotos/planos.

---

## 4. Módulo de Intersecciones (Cruces Semaforizados)

### 4.1. Catálogo e Inventario
- Visualización en tabla paginada de todas las intersecciones de Lima Metropolitana.
- Búsqueda por código, nombre de vía principal, vía secundaria o distrito.
- Visualización de tipo de control (Centralizado, Aislado, Actuado), tipo de comunicación (Fibra Óptica, 4G, Inalámbrico) y empresa eléctrica.

### 4.2. Detalle de Intersección y Periféricos
Al ingresar a una intersección se puede consultar:
- **Ficha Técnica Vial**: Georreferenciación (Latitud/Longitud), tipo de estructura y planos descargables (PDF / DWG).
- **Periféricos Asociados**: Lista de controladores, cámaras de detección, UPS, sensores vehiculares con modelo, número de serie, dirección IP y estado de garantía.

---

## 5. Módulo de Reportes Estadísticos y Mapas de Calor

### 5.1. Reporte Gráfico Interactivo
Permite el análisis visual mediante 5 gráficos interactivos:
1. **Distribución por Tipo de Incidencia** (Gráfico Circular).
2. **Top 10 Intersecciones con Mayor Incidencia** (Gráfico de Barras).
3. **Distribución por Estado Operativo** (Gráfico de Barras).
4. **Evolución Temporal de Fallas** (Línea de tendencia adaptativa por hora/día/mes).
5. **Top Averías Atendidas vs. Por Atender** (Barras comparativas).

#### Exportación:
- **Exportar a PDF**: Genera un documento ejecutivo con membrete oficial ("División de Monitoreo y Control - SGF - GMU") que incluye todos los gráficos y métricas consolidadas.
- **Exportar a Excel**: Genera un archivo `.xlsx` con matriz de intersecciones versus tipos de falla y títulos descriptivos.

### 5.2. Mapa de Calor (Heatmap)
- Representación de densidad térmica sobre el mapa de Lima para identificar puntos calientes ("hotspots") de averías recurrentes.
- Filtros por año, mes, tipo y característica técnica (`I = Incidencias`, `T = Trabajos programados`).

---

## 6. Módulo de Administración (Solo Administradores)

- **Gestión de Usuarios**: Creación de cuentas, asignación de grupos y reseteo de contraseñas.
- **Grupos y Permisos (RBAC)**: Matriz de permisos por módulo y acción (Crear, Editar, Eliminar, Ver, Exportar).
- **Mantenimiento de Catálogos**: Tipos de incidencia, áreas, equipos, reportadores y empresas de suministro.
- **Árbol de Menús Dinámicos**: Reorganización del menú lateral con modelo jerárquico.
- **Auditoría del Sistema**: Registro detallado de quién modificó qué registro y desde qué dirección IP.
