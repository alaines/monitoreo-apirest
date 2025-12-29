FROM node:18-alpine AS base

WORKDIR /app

# Copiar archivos de configuración
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Development
FROM base AS development
EXPOSE 5173
CMD ["npm", "run", "frontend:dev"]

# Build
FROM base AS build
RUN npm run build -w apps/frontend

# Production
FROM nginx:alpine AS production
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
