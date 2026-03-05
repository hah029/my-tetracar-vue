# Этап сборки
FROM node:22-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm set strict-ssl false && npm install

COPY . .
RUN npm run build

# Финальный образ с Nginx
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Копируем свой конфиг (опционально)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]