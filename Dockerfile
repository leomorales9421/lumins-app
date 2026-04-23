# Etapa 1: Construcción (Build)
FROM node:20-alpine AS build

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos de dependencias
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto del código fuente del frontend
COPY . .

# Construir la aplicación para producción (esto generará la carpeta /dist)
RUN npx vite build

# Etapa 2: Producción (Servir con Nginx)
FROM nginx:alpine

# Copiar los archivos construidos desde la etapa anterior al directorio html de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar una configuración personalizada de Nginx para manejar el enrutamiento de React
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80 dentro del contenedor
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
