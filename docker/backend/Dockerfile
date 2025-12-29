FROM node:18-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar archivos de configuración
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npm run prisma:generate -w apps/backend

# Development
FROM base AS development
EXPOSE 3000
CMD ["npm", "run", "backend:dev"]

# Build
FROM base AS build
RUN npm run build -w apps/backend

# Production
FROM node:18-alpine AS production
WORKDIR /app

# Copiar solo lo necesario para producción
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/node_modules ./node_modules
COPY --from=build /app/apps/backend/package.json ./

EXPOSE 3000
CMD ["node", "dist/main"]
