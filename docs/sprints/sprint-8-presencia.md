# Sprint 8 - Sistema de Presencia y Notificaciones

**Sprint**: 8  
**Duración**: 2 semanas (Enero 15-29, 2026)  
**Objetivo**: Implementar sistema de presencia online y base para mensajería  
**Prioridad**: Alta ⭐

---

## Objetivos del Sprint

### Objetivo Principal
Implementar infraestructura WebSocket para saber qué usuarios están conectados en tiempo real, sentando las bases para el futuro sistema de mensajería.

### Objetivos Secundarios
1. Centro de notificaciones en header
2. Sistema de alertas básico
3. Base de datos para mensajes futuros

---

## Historias de Usuario

### US-057: Sistema de Presencia Online
**Como** administrador  
**Quiero** ver qué usuarios están conectados  
**Para** saber quién está disponible en tiempo real

**Criterios de Aceptación**:
- [ ] Indicador verde/gris junto al nombre de usuario
- [ ] Lista de usuarios online en tiempo real
- [ ] Actualización automática sin refresh
- [ ] Detección de conexión/desconexión

**Estimación**: 8 puntos

**Tareas Técnicas**:
1. Instalar Socket.io en backend y frontend
2. Crear módulo de WebSocket en NestJS
3. Tabla `user_sessions` para tracking
4. Componente UserPresence en frontend
5. Heartbeat cada 30 segundos
6. Manejo de reconexión automática

---

### US-058: Indicador de Presencia en Lista de Usuarios
**Como** usuario  
**Quiero** ver quién está online en la lista de usuarios  
**Para** contactar personas disponibles

**Criterios de Aceptación**:
- [ ] Punto verde = online
- [ ] Punto gris = offline
- [ ] Texto "Hace X minutos" para últimos conectados
- [ ] Tooltip con información detallada

**Estimación**: 5 puntos

---

### US-059: Centro de Notificaciones
**Como** usuario  
**Quiero** un centro de notificaciones en el header  
**Para** ver alertas importantes sin perder contexto

**Criterios de Aceptación**:
- [ ] Icono de campana en header con badge de contador
- [ ] Dropdown con últimas 10 notificaciones
- [ ] Marcar como leída individualmente
- [ ] Marcar todas como leídas
- [ ] Link a página completa de notificaciones

**Estimación**: 8 puntos

**Tareas Técnicas**:
1. Tabla `notifications` en base de datos
2. Endpoint `/api/notifications`
3. Componente NotificationCenter
4. WebSocket para push de notificaciones
5. Service Worker para notificaciones del navegador

---

### US-060: Notificaciones Automáticas
**Como** usuario  
**Quiero** recibir notificaciones de eventos importantes  
**Para** estar informado sin tener que buscar

**Criterios de Aceptación**:
- [ ] Notificación cuando se asigna incidencia a mi equipo
- [ ] Notificación de incidencias de alta prioridad
- [ ] Notificación de cambio de estado
- [ ] Notificación de nuevos comentarios en mis tickets

**Estimación**: 13 puntos

---

## Arquitectura Técnica

### Backend

#### 1. Módulo WebSocket (NestJS)
```typescript
// websocket/websocket.gateway.ts
@WebSocketGateway({
  cors: { origin: '*' }
})
export class WebSocketGateway {
  @SubscribeMessage('user:connect')
  handleUserConnect(client: Socket, userId: number) {
    // Register user session
    // Broadcast to all clients
  }
  
  @SubscribeMessage('heartbeat')
  handleHeartbeat(client: Socket) {
    // Update last_activity
  }
}
```

#### 2. Schema de Base de Datos
```sql
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  socket_id VARCHAR(255),
  connected_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  disconnected_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'online' -- online, away, busy, offline
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50), -- incident_assigned, high_priority, status_change
  title VARCHAR(255),
  message TEXT,
  data JSONB,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread 
ON notifications(user_id, read_at) 
WHERE read_at IS NULL;
```

#### 3. Servicios
- `PresenceService`: Gestión de sesiones
- `NotificationService`: CRUD de notificaciones
- `EventsService`: Emisión de eventos WebSocket

### Frontend

#### 1. Socket Context
```typescript
// contexts/SocketContext.tsx
export const SocketProvider = ({ children }) => {
  const socket = io('http://localhost:3001');
  
  useEffect(() => {
    socket.on('connect', () => {
      socket.emit('user:connect', { userId });
    });
    
    socket.on('notification', (data) => {
      // Handle notification
    });
  }, []);
  
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
```

#### 2. Componentes
- `NotificationCenter`: Dropdown en header
- `UserPresenceIndicator`: Punto de estado
- `OnlineUsersList`: Lista de usuarios conectados
- `NotificationItem`: Item individual de notificación

---

## Tareas Técnicas Detalladas

### Backend
1. **Setup WebSocket** (3h)
   - [ ] Instalar `@nestjs/websockets` y `socket.io`
   - [ ] Crear módulo `WebSocketModule`
   - [ ] Configurar CORS para WebSocket
   - [ ] Gateway básico con conexión/desconexión

2. **Gestión de Presencia** (5h)
   - [ ] Tabla `user_sessions`
   - [ ] Service para CRUD de sesiones
   - [ ] Heartbeat handler
   - [ ] Cleanup de sesiones antiguas (cron)
   - [ ] Endpoint `/api/presence/online-users`

3. **Sistema de Notificaciones** (8h)
   - [ ] Tabla `notifications`
   - [ ] NotificationService con CRUD
   - [ ] Endpoints RESTful
   - [ ] Integración con WebSocket
   - [ ] Event emitters en servicios existentes

### Frontend
1. **Setup Socket.io Client** (2h)
   - [ ] Instalar `socket.io-client`
   - [ ] Crear SocketContext
   - [ ] Integrar en App.tsx
   - [ ] Manejo de reconexión

2. **Centro de Notificaciones** (6h)
   - [ ] Componente NotificationCenter
   - [ ] Badge con contador
   - [ ] Dropdown con lista
   - [ ] Marcar como leída
   - [ ] Estilos y animaciones

3. **Indicadores de Presencia** (4h)
   - [ ] UserPresenceIndicator component
   - [ ] Integrar en lista de usuarios
   - [ ] Integrar en header
   - [ ] Tooltip con info

---

## Testing

### Tests Unitarios
- [ ] PresenceService.registerSession()
- [ ] PresenceService.getOnlineUsers()
- [ ] NotificationService.create()
- [ ] NotificationService.markAsRead()

### Tests de Integración
- [ ] WebSocket connection flow
- [ ] Heartbeat mechanism
- [ ] Notification delivery
- [ ] Session cleanup

### Tests E2E
- [ ] Usuario se conecta → aparece online
- [ ] Usuario cierra tab → aparece offline
- [ ] Crear incidencia → notificación a equipo
- [ ] Marcar notificación como leída

---

## Dependencias

### Backend
```json
{
  "@nestjs/websockets": "^10.0.0",
  "@nestjs/platform-socket.io": "^10.0.0",
  "socket.io": "^4.6.0",
  "@nestjs/schedule": "^4.0.0"
}
```

### Frontend
```json
{
  "socket.io-client": "^4.6.0"
}
```

---

## Diseño UI/UX

### Notificaciones
- Icono de campana en header (top-right)
- Badge rojo con número de no leídas
- Dropdown de 300px de ancho
- Máximo 10 notificaciones visibles
- Link "Ver todas" al final
- Animación al recibir nueva notificación

### Indicador de Presencia
- Punto de 8px de diámetro
- Verde (#28a745) = online
- Amarillo (#ffc107) = ausente (>5 min)
- Gris (#6c757d) = offline
- Tooltip: "Online" | "Hace 5 minutos" | "Offline"

---

## Métricas de Éxito

### Performance
- Latencia WebSocket < 100ms
- Heartbeat overhead < 1KB/30s
- Reconnection time < 2s

### Funcionalidad
- 100% de conexiones/desconexiones detectadas
- Notificaciones entregadas en <1s
- 0 notificaciones perdidas

### UX
- Satisfacción de usuario > 4/5
- Adopción de notificaciones > 80%
- Tiempo de respuesta a incidencias reducido

---

## Plan de Deployment

### Fase 1: Development (Semana 1)
- Setup WebSocket en local
- Tabla de sesiones
- Tests básicos

### Fase 2: Testing (Semana 2)
- Tests de carga
- Múltiples conexiones simultáneas
- Manejo de errores

### Fase 3: Production (Semana 2)
- Deploy a staging
- Verificación de performance
- Deploy a production
- Monitoreo activo

---

## 🔜 Preparación para Sprint 9

Este sprint sienta las bases para:
- Sistema de mensajería 1:1 (Sprint 9)
- Mensajes grupales (Sprint 10)
- Video llamadas (Futuro)

---

## Referencias

- [Socket.io Documentation](https://socket.io/docs/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [Web Push Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

**Estimación total**: 34 puntos (~1.5 semanas)  
**Complejidad**: Media-Alta  
**Riesgo**: Bajo-Medio
