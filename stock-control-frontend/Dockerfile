# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/build /usr/share/nginx/html

# Create simple nginx config that just works
RUN echo 'server {' > /etc/nginx/conf.d/default.conf
RUN echo '    listen 80;' >> /etc/nginx/conf.d/default.conf
RUN echo '    server_name _;' >> /etc/nginx/conf.d/default.conf
RUN echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf
RUN echo '    index index.html;' >> /etc/nginx/conf.d/default.conf
RUN echo '    location / {' >> /etc/nginx/conf.d/default.conf
RUN echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf
RUN echo '    }' >> /etc/nginx/conf.d/default.conf
RUN echo '    location /health {' >> /etc/nginx/conf.d/default.conf
RUN echo '        return 200 "healthy";' >> /etc/nginx/conf.d/default.conf
RUN echo '        add_header Content-Type text/plain;' >> /etc/nginx/conf.d/default.conf
RUN echo '    }' >> /etc/nginx/conf.d/default.conf
RUN echo '}' >> /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]