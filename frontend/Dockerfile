########################  Build-Stage  ########################
FROM node:20 AS builder
WORKDIR /app

# .npmrc MUSS mitkopiert werden (enthält ${…}-Platzhalter)
COPY package*.json ./
RUN npm ci --no-audit --prefer-offline

COPY . .
RUN npm run build -- --configuration production   # → dist/test-suite/browser

########################  Runtime-Stage  ######################
FROM nginx:1.27-alpine

# Angular-Build (Ordner **browser**) direkt ins Nginx-Root
COPY --from=builder /app/dist/test-suite/browser /usr/share/nginx/html

# SPA-Fallback + API-Proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
