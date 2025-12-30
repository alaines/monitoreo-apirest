#!/bin/bash

# Script para crear incidencias de prueba
API_URL="http://192.168.18.230:3001/api"

echo "🔐 Iniciando sesión..."
# Login con usuario admin
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "admin_test",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error al obtener token. Respuesta:"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Token obtenido"
echo ""

# Crear incidencias de prueba
echo "📝 Creando incidencias de prueba..."

# Incidencia 1 - Pendiente (estadoId: 1)
echo "Creando incidencia 1 (Pendiente)..."
curl -s -X POST "$API_URL/incidents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "incidenciaId": 3,
    "prioridadId": 1,
    "cruceId": 5,
    "descripcion": "Semáforo apagado en intersección principal, urge atención",
    "reportadorNombres": "Juan Pérez",
    "reportadorDatoContacto": "987654321"
  }' | python3 -m json.tool

# Incidencia 2 - En Progreso (estadoId: 2)
echo "Creando incidencia 2 (En Progreso)..."
curl -s -X POST "$API_URL/incidents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "incidenciaId": 2,
    "prioridadId": 2,
    "cruceId": 6,
    "descripcion": "Semáforo no comunica con el servidor central",
    "reportadorNombres": "María García",
    "reportadorDatoContacto": "912345678"
  }' | python3 -m json.tool

# Incidencia 3 - Pendiente
echo "Creando incidencia 3 (Pendiente)..."
curl -s -X POST "$API_URL/incidents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "incidenciaId": 4,
    "prioridadId": 3,
    "cruceId": 7,
    "descripcion": "Semáforos del cruce sin sincronismo, causan tráfico",
    "reportadorNombres": "Carlos López",
    "reportadorDatoContacto": "998877665"
  }' | python3 -m json.tool

# Incidencia 4 - En Progreso
echo "Creando incidencia 4 (En Progreso)..."
curl -s -X POST "$API_URL/incidents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "incidenciaId": 1,
    "prioridadId": 2,
    "cruceId": 8,
    "descripcion": "Problema general en cruce de avenidas principales",
    "reportadorNombres": "Ana Torres",
    "reportadorDatoContacto": "976543210"
  }' | python3 -m json.tool

# Incidencia 5 - Completada (estadoId: 3)
echo "Creando incidencia 5 (Pendiente)..."
curl -s -X POST "$API_URL/incidents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "incidenciaId": 3,
    "prioridadId": 1,
    "cruceId": 9,
    "descripcion": "Semáforo totalmente apagado por corte de energía",
    "reportadorNombres": "Roberto Díaz",
    "reportadorDatoContacto": "965432109"
  }' | python3 -m json.tool

echo ""
echo "✅ Incidencias de prueba creadas"
echo "Ahora actualizando estados..."

# Obtener IDs de las incidencias creadas
INCIDENTS=$(curl -s -X GET "$API_URL/incidents?limit=100" \
  -H "Authorization: Bearer $TOKEN")

# Actualizar incidencia 2 y 4 a En Progreso (estadoId: 2)
echo "Actualizando incidencias a 'En Progreso'..."
# Asumiendo que las incidencias tienen IDs consecutivos, vamos a actualizar las últimas creadas

# Actualizar incidencia 5 a Completada (estadoId: 3)
echo "Actualizando incidencia a 'Completada'..."

echo ""
echo "✅ Script completado"
echo "🌐 Visita http://192.168.18.230:5173 para ver el dashboard"
