# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Remove configuração padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf
RUN rm /etc/nginx/nginx.conf

# Copiar arquivos de configuração personalizados
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos da build
COPY --from=build /app/build /usr/share/nginx/html

# Criar diretórios necessários
RUN mkdir -p /var/log/nginx
RUN mkdir -p /var/run

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]