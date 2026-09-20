FROM node:20-alpine AS base

# Instalar dependencias del sistema requeridas por Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copiar archivos de definición de monorepo
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Instalar dependencias completas del workspace
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Compilar types compartidos y generar cliente Prisma
RUN npm run build -w packages/shared-types --if-present && \
    npm run prisma:generate -w apps/backend

# Development
FROM base AS development
EXPOSE 3000
CMD ["sh", "-c", "npm run prisma:generate -w apps/backend && npm run backend:dev"]

# Build
FROM base AS build
RUN npm run build -w apps/backend

# Production
FROM node:20-alpine AS production
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Copiar artefactos de compilación y node_modules
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main"]
