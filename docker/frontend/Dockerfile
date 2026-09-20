FROM node:20-alpine AS base

WORKDIR /app

# Copiar archivos de definición de monorepo
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Instalar dependencias completas del workspace
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Compilar types compartidos
RUN npm run build -w packages/shared-types --if-present

# Development
FROM base AS development
EXPOSE 5173
CMD ["npm", "run", "frontend:dev", "--", "--host", "0.0.0.0"]

# Build
FROM base AS build
RUN npm run build -w apps/frontend

# Production
FROM nginx:alpine AS production
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
